using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchById;

internal sealed class GetOwnerBranchByIdHandler(IApplicationDbContext dbContext, IUserContext userContext)
    : IQueryHandler<GetOwnerBranchByIdQuery, OwnerBranchDetailDto>
{
    public async Task<Result<OwnerBranchDetailDto>> Handle(
        GetOwnerBranchByIdQuery request, CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches.AsNoTracking().AsSplitQuery()
            .Include(x => x.QrImage)
            .Include(x => x.BranchSportTypes).ThenInclude(x => x.SportType)
            .Include(x => x.Images).ThenInclude(x => x.Image)
            .Include(x => x.Reviews)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (branch is null)
            return Result.Failure<OwnerBranchDetailDto>(new NotFoundError("Branch", request.Id));
        if (branch.CourtOwnerId != userContext.UserId)
            return Result.Failure<OwnerBranchDetailDto>(new ForbiddenError("Chi nhánh không thuộc chủ sân này."));
        return Result.Success(branch.ToDetail());
    }
}
