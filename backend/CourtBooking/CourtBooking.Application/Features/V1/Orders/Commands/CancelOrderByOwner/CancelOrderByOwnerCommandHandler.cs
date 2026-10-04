using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderByOwner;

public sealed class CancelOrderByOwnerCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuthorizationService) : ICommandHandler<CancelOrderByOwnerCommand>
{
    public async Task<Result> Handle(CancelOrderByOwnerCommand request, CancellationToken cancellationToken)
    {
        // 1. Tải đơn hàng cùng lịch sử giao dịch
        var order = await dbContext.Orders
            .Include(o => o.PaymentTransactions)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));
        }

        // 2. Kiểm tra quyền sở hữu chi nhánh
        var isAuthorized = await branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isAuthorized)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }

        // 3. Kiểm tra trạng thái đơn hàng
        if (order.Status == OrderStatus.Cancelled)
        {
            return Result.Failure(new BadError("Đơn hàng này đã bị hủy trước đó."));
        }

        if (order.Status == OrderStatus.Completed)
        {
            return Result.Failure(new BadError("Đơn hàng đã hoàn thành, không thể hủy."));
        }

        // 4. Xử lý hoàn tiền nếu có
        if (request.RefundAmount.HasValue && request.RefundAmount.Value > 0)
        {
            var totalPaid = order.PaymentTransactions
                .Where(t => t.Type == PaymentTransactionType.Payment)
                .Sum(t => t.Amount);

            var totalRefunded = order.PaymentTransactions
                .Where(t => t.Type == PaymentTransactionType.Refund)
                .Sum(t => t.Amount);

            var maxRefundable = totalPaid - totalRefunded;

            if (request.RefundAmount.Value > maxRefundable)
            {
                return Result.Failure(new BadError($"Số tiền hoàn ({request.RefundAmount.Value:N0} đ) vượt quá số tiền khách đã thanh toán có thể hoàn (tối đa {maxRefundable:N0} đ)."));
            }

            order.AddPaymentTransaction(
                request.RefundAmount.Value,
                request.RefundMethod ?? PaymentMethod.Cash,
                null,
                PaymentTransactionType.Refund);
        }

        // 5. Cập nhật trạng thái đơn thành Cancelled và lưu lý do hủy
        order.CancelOrder(request.CancelReason);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
