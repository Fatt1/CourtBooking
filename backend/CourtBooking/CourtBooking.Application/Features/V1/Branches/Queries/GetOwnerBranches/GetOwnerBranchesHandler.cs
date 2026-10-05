using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranches;

internal sealed class GetOwnerBranchesHandler(IApplicationDbContext dbContext, IUserContext userContext)
    : IQueryHandler<GetOwnerBranchesQuery, IReadOnlyList<OwnerBranchListItemDto>>
{
    public async Task<Result<IReadOnlyList<OwnerBranchListItemDto>>> Handle(
        GetOwnerBranchesQuery request, CancellationToken cancellationToken)
    {
        var branches = await dbContext.Branches.AsNoTracking().AsSplitQuery()
            .Where(x => x.CourtOwnerId == userContext.UserId)
            .Include(x => x.BranchSportTypes).ThenInclude(x => x.SportType)
            .Include(x => x.Images).ThenInclude(x => x.Image)
            .Include(x => x.Reviews)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
        return Result.Success<IReadOnlyList<OwnerBranchListItemDto>>(
            branches.Select(x => x.ToListItem()).ToList());
    }
}
