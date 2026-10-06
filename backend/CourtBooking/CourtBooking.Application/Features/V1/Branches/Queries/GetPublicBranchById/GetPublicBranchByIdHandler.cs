using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetPublicBranchById;

internal sealed class GetPublicBranchByIdHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetPublicBranchByIdQuery, PublicBranchDetailDto>
{
    public async Task<Result<PublicBranchDetailDto>> Handle(
        GetPublicBranchByIdQuery request,
        CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches.AsNoTracking()
            .AsSplitQuery()
            .Where(b => b.Id == request.Id && b.IsActive)
            .Select(b => new PublicBranchDetailDto(
                b.Id,
                b.Name,
                b.Hotline,
                b.Province,
                b.District,
                b.Street,
                b.GgMapUrl,
                b.OpenTime,
                b.CloseTime,
                b.Policy,
                b.MinPrice,
                b.MaxPrice,
                b.ReviewAverage,
                b.Images
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => new ImageDto(i.Image.StorageKey, i.ImageId))
                    .ToList(),
                b.BranchSportTypes.Select(bst => new BranchSportDto(bst.SportTypeId, bst.SportType.Name))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        if (branch == null)
        {
            return Result.Failure<PublicBranchDetailDto>(new NotFoundError("Branch", request.Id));
        }

        return Result.Success(branch);
    }
}
