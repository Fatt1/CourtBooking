using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourtStatus;

internal sealed class UpdateCourtStatusHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : ICommandHandler<UpdateCourtStatusCommand>
{
    public async Task<Result> Handle(
        UpdateCourtStatusCommand request,
        CancellationToken cancellationToken)
    {
        var court = await dbContext.Courts
            .Include(c => c.CourtType)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (court is null)
        {
            return Result.Failure(new NotFoundError("Court", request.Id));
        }

        var authResult = await branchAuth.EnsureOwnerAsync(court.CourtType.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        court.Status = request.Status;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
