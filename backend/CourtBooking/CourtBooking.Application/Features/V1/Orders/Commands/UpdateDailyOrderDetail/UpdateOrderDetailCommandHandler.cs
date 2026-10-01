using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderDetail;

public class UpdateOrderDetailCommandHandler : ICommandHandler<UpdateOrderDetailCommand>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IOrderChecker _bookingValidator;
    private readonly IBranchAuthorizationService _branchAuthorizationService;
    private readonly AsyncKeyedLocker<string> _keyedLocker;
    public UpdateOrderDetailCommandHandler(IApplicationDbContext dbContext, IBranchAuthorizationService branchAuthorizationService, IOrderChecker bookingValidator, AsyncKeyedLocker<string> keyedLocker)
    {
        _bookingValidator = bookingValidator;
        _dbContext = dbContext;
        _keyedLocker = keyedLocker;
        _branchAuthorizationService = branchAuthorizationService;
    }

    public async Task<Result> Handle(UpdateOrderDetailCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
           .Include(o => o.Details)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);
        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));
        }
        var isAuthorized = await _branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isAuthorized)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }


        var validationResult = await _bookingValidator.ValidateBookingAsync(
            branchId: order.BranchId,
            courtSlots: request.CourtBookingSlots,
            null,
            false,
            cancellationToken
            );
        if (validationResult.IsFailure)
        {
            return Result.Failure(validationResult.Error!);
        }

        var bookingContext = validationResult.Value;


        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {

                releasers.Add(await _keyedLocker.LockAsync(key, cancellationToken));
            }
            var conflictResult = await _bookingValidator.CheckConflictsAsync(bookingContext.FlatSlots, cancellationToken);
            if (conflictResult.IsFailure)
            {
                return Result.Failure(conflictResult.Error!);
            }

            _dbContext.OrderDetails.RemoveRange(order.Details);
            order.ClearOrderDetails();
            foreach (var slot in bookingContext.CalculatedSlots)
            {
                order.AddOrderDetail(
                    slot.CourtId,
                    slot.StartTime,
                    slot.EndTime,
                    slot.Price,
                    slot.Date);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);


        }

        finally
        {
            for (int i = releasers.Count - 1; i >= 0; i--)
            {
                releasers[i].Dispose();
            }
        }

        return Result.Success();



    }
}
