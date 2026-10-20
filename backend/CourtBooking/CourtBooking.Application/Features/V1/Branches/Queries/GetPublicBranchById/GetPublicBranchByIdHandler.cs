using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Application.Helpers;
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
            .Select(b => new
            {
                b.Id,
                b.Name,
                b.Hotline,
                b.Province,
                b.District,
                b.Street,
                b.Latitude,
                b.Longitude,
                b.OpenTime,
                b.CloseTime,
                b.Policy,
                b.Description,
                b.MinPrice,
                b.MaxPrice,
                b.ReviewAverage,
                Images = b.Images
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => new ImageDto(i.Image.StorageKey, i.ImageId))
                    .ToList(),
                Sports = b.BranchSportTypes
                    .Select(bst => new BranchSportDto(bst.SportTypeId, bst.SportType.Name))
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (branch == null)
        {
            return Result.Failure<PublicBranchDetailDto>(new NotFoundError("Branch", request.Id));
        }

        // Tọa độ người chơi: nếu người dùng không mở định vị, mặc định lấy tọa độ Dinh Độc Lập
        var userLat = request.Latitude ?? GeoHelper.DefaultLatitude;
        var userLng = request.Longitude ?? GeoHelper.DefaultLongitude;

        double? distanceKm = null;
        if (branch.Latitude.HasValue && branch.Longitude.HasValue)
        {
            distanceKm = GeoHelper.CalculateDistanceKm(
                (double)userLat,
                (double)userLng,
                (double)branch.Latitude.Value,
                (double)branch.Longitude.Value);
        }

        var ggMapUrl = branch.Latitude.HasValue && branch.Longitude.HasValue
            ? $"https://www.google.com/maps?q={branch.Latitude.Value},{branch.Longitude.Value}"
            : null;

        var dto = new PublicBranchDetailDto(
            branch.Id,
            branch.Name,
            branch.Hotline,
            branch.Province,
            branch.District,
            branch.Street,
            ggMapUrl,
            distanceKm,
            branch.OpenTime,
            branch.CloseTime,
            branch.Policy,
            branch.Description,
            branch.MinPrice,
            branch.MaxPrice,
            branch.ReviewAverage,
            branch.Images,
            branch.Sports);

        return Result.Success(dto);
    }
}
