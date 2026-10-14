using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateCustomerInfo;

public class UpdateOrderCustomerInfoCommandHandler(IApplicationDbContext applicationDbContext, IBranchAuthorizationService branchAuthorizationService) : ICommandHandler<UpdateOrderCustomerInfoCommand>
{
    public async Task<Result> Handle(UpdateOrderCustomerInfoCommand request, CancellationToken cancellationToken)
    {
        var order = await applicationDbContext.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);
        if (order is null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));
        }

        var isAuthorized = await branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);

        if (!isAuthorized)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }

        order.UpdateCustomerInfo(request.CustomerName, request.CustomerPhoneNumber);
        await applicationDbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
