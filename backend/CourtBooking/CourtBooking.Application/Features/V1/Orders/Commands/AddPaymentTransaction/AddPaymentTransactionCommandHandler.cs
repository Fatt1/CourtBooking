using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddPaymentTransaction;

public sealed class AddPaymentTransactionCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuthorizationService,
    IPublisher publisher) : ICommandHandler<AddPaymentTransactionCommand, Guid>
{
    public async Task<Result<Guid>> Handle(AddPaymentTransactionCommand request, CancellationToken cancellationToken)
    {
        // 1. Tải đơn hàng cùng danh sách giao dịch
        var order = await dbContext.Orders
            .Include(o => o.PaymentTransactions)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure<Guid>(new NotFoundError("Order", request.OrderId));
        }

        // 2. Kiểm tra quyền sở hữu chi nhánh
        var isAuthorized = await branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isAuthorized)
        {
            return Result.Failure<Guid>(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }

        // 3. Kiểm tra trạng thái đơn hàng
        if (order.Status == OrderStatus.Cancelled)
        {
            return Result.Failure<Guid>(new BadError("Không thể thu tiền cho đơn hàng đã bị hủy."));
        }

        // 4. Kiểm tra số tiền còn lại cần thu
        var remaining = order.CalculateRemainingAmount();
        if (remaining <= 0)
        {
            return Result.Failure<Guid>(new BadError("Đơn hàng đã được thanh toán đầy đủ, không còn số tiền cần thu."));
        }

        if (request.Amount > remaining)
        {
            return Result.Failure<Guid>(new BadError($"Số tiền thu ({request.Amount:N0} đ) vượt quá số tiền còn lại cần thanh toán ({remaining:N0} đ)."));
        }

        // 5. Thêm giao dịch thanh toán
        var transaction = order.AddPaymentTransaction(
            request.Amount,
            request.Method,
            request.ProofImageId,
            PaymentTransactionType.Payment);

        // Nếu đơn hàng đang ở trạng thái chờ thanh toán hoặc chờ duyệt, tự động duyệt đơn
        if (order.Status == OrderStatus.AwaitingPayment || order.Status == OrderStatus.PendingConfirmation)
        {
            order.ConfirmOrder();
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // 6. Gắn ảnh chứng minh nếu có
        if (request.ProofImageId.HasValue)
        {
            await publisher.Publish(new AttachImagesEvent([request.ProofImageId.Value]), cancellationToken);
        }

        return Result<Guid>.Success(transaction.Id);
    }
}
