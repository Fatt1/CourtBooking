using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.RejectOrderCancellation;

public sealed class RejectOrderCancellationCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuthorizationService) : ICommandHandler<RejectOrderCancellationCommand>
{
    public async Task<Result> Handle(RejectOrderCancellationCommand request, CancellationToken cancellationToken)
    {
        // 1. Tải đơn hàng
        var order = await dbContext.Orders
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
            return Result.Failure(new BadError("Đơn hàng đã hoàn thành, không thể thay đổi."));
        }

        if (order.Status != OrderStatus.RequestCancellation)
        {
            return Result.Failure(new BadError("Chỉ có thể từ chối yêu cầu hủy khi đơn hàng đang ở trạng thái chờ duyệt hủy."));
        }

        // 4. Chuyển trạng thái đơn hàng sang Confirmed (Đã nhận / Đã xác nhận)
        order.Status = OrderStatus.Confirmed;
        order.CancelReason = null;

        if (!string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            var rejectionNote = $"[Từ chối hủy: {request.RejectionReason.Trim()}]";
            order.Note = string.IsNullOrWhiteSpace(order.Note)
                ? rejectionNote
                : $"{order.Note} | {rejectionNote}";
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
