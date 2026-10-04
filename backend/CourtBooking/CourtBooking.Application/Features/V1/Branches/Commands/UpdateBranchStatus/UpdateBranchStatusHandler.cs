using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranchStatus;

internal sealed class UpdateBranchStatusHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext)
    : ICommandHandler<UpdateBranchStatusCommand>
{
    public async Task<Result> Handle(UpdateBranchStatusCommand request, CancellationToken ct)
    {
        var branch = await dbContext.Branches
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (branch is null)
            return Result.Failure(new NotFoundError("Branch", request.Id));

        if (branch.CourtOwnerId != userContext.UserId)
            return Result.Failure(new ForbiddenError("Chi nhánh không thuộc chủ sân này."));

        branch.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync(ct);

        return Result.Success();
    }
}
