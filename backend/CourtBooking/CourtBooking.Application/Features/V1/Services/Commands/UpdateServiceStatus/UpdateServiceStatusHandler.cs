using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Commands.UpdateServiceStatus;

internal sealed class UpdateServiceStatusHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<UpdateServiceStatusCommand>
{
    public async Task<Result> Handle(UpdateServiceStatusCommand request, CancellationToken cancellationToken)
    {
        var authorization = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authorization.IsFailure) return authorization;

        var serviceBranch = await dbContext.ServiceBranches
            .FirstOrDefaultAsync(item => item.ServiceId == request.ServiceId
                && item.BranchId == request.BranchId, cancellationToken);
        if (serviceBranch is null)
            return Result.Failure(new NotFoundError("ServiceBranch", request.ServiceId));

        serviceBranch.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
