using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderOnline;

public sealed class CancelOrderOnlineCommandHandler(
    IApplicationDbContext dbContext) : ICommandHandler<CancelOrderOnlineCommand>
{
    public async Task<Result> Handle(CancelOrderOnlineCommand request, CancellationToken cancellationToken)
    {
        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            return Result.Success();
        }

        if (order.Status == OrderStatus.AwaitingPayment)
        {
            order.CancelOrder(request.CancelReason ?? "Khách hàng hủy thanh toán trực tuyến.");
        }
        else if (order.Status == OrderStatus.PendingConfirmation || order.Status == OrderStatus.Confirmed)
        {
            order.Status = OrderStatus.RequestCancellation;
            order.CancelReason = request.CancelReason ?? "Khách hàng yêu cầu hủy đơn đặt sân.";
        }
        else if (order.Status == OrderStatus.RequestCancellation)
        {
            return Result.Failure(new BadError("Đơn hàng đã gửi yêu cầu hủy trước đó và đang chờ chủ sân duyệt."));
        }
        else
        {
            return Result.Failure(new BadError("Không thể hủy đơn hàng ở trạng thái hiện tại."));
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
