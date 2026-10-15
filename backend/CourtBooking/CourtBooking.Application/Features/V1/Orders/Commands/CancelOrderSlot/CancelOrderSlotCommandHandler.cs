using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderSlot;

public sealed class CancelOrderSlotCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuthorizationService) : ICommandHandler<CancelOrderSlotCommand>
{
    public async Task<Result> Handle(CancelOrderSlotCommand request, CancellationToken cancellationToken)
    {
        // 1. Tải đơn hàng cùng chi tiết ca sân và lịch sử thanh toán
        var order = await dbContext.Orders
            .Include(o => o.Details)
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

        // 4. Tìm ca sân chỉ định cần xóa
        var detail = order.Details.FirstOrDefault(d => d.Id == request.OrderDetailId);
        if (detail == null)
        {
            return Result.Failure(new NotFoundError("OrderDetail", request.OrderDetailId));
        }

        // 5. Xử lý hoàn tiền nếu chủ sân yêu cầu hoàn tiền cho ca này
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

        // 6. Xóa ca sân khỏi danh sách và cập nhật tổng tiền
        order.RemoveOrderDetail(detail.Id);
        dbContext.OrderDetails.Remove(detail);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
