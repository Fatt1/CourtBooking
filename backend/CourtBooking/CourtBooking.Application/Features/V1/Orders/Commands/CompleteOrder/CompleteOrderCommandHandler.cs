using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CompleteOrder;

public sealed class CompleteOrderCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuthorizationService) : ICommandHandler<CompleteOrderCommand>
{
    public async Task<Result> Handle(CompleteOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));
        }

        var isAuthorized = await branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isAuthorized)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }

        if (order.Status == OrderStatus.Completed)
        {
            return Result.Failure(new BadError("Đơn hàng đã hoàn thành trước đó."));
        }

        if (order.Status != OrderStatus.Confirmed)
        {
            return Result.Failure(new BadError("Chỉ có thể hoàn thành đơn hàng ở trạng thái đã xác nhận."));
        }

        order.CompleteOrder();
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
