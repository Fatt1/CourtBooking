using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.ConfirmOrder;

public class ConfirmOrderCommandHandler : ICommandHandler<ConfirmOrderCommand>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IBranchAuthorizationService _branchAuth;

    public ConfirmOrderCommandHandler(IApplicationDbContext dbContext, IBranchAuthorizationService branchAuth)
    {
        _dbContext = dbContext;
        _branchAuth = branchAuth;
    }

    public async Task<Result> Handle(ConfirmOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken);
        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId.ToString()));
        }

        var isOwner = await _branchAuth.IsOwnerAsync(order.BranchId, cancellationToken);

        if (!isOwner)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền xác nhận đơn hàng này."));
        }
        order.ConfirmOrder();
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
