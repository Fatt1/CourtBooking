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
            .OrderBy(x => x.Name)
            .Select(branch => new OwnerBranchListItemDto(
                Id: branch.Id,
                Name: branch.Name,
                Hotline: branch.Hotline,
                Province: branch.Province,
                District: branch.District,
                Street: branch.Street,
                OpenTime: branch.OpenTime,
                CloseTime: branch.CloseTime,
                IsActive: branch.IsActive,
                AverageRating: branch.ReviewAverage
                ))
            .ToListAsync(cancellationToken);



        return Result.Success<IReadOnlyList<OwnerBranchListItemDto>>(branches);
    }
}
