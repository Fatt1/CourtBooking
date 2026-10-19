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

        // Chỉ cho phép khách hàng hủy khi đang chờ thanh toán
        if (order.Status != OrderStatus.AwaitingPayment)
        {
            return Result.Failure(new BadError("Chỉ có thể hủy đơn hàng khi đang trong trạng thái chờ thanh toán."));
        }

        order.CancelOrder(request.CancelReason ?? "Khách hàng hủy thanh toán trực tuyến.");
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
