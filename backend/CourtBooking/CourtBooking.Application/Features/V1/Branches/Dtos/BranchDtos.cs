using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Domain.Entities.Courts;

namespace CourtBooking.Application.Features.V1.Branches.Dtos;

public sealed record BranchSportDto(Guid Id, string Name);
public sealed record BranchImageDto(Guid Id, string Key);

public sealed record BranchReviewItemDto(
    Guid Id,
    string PlayerName,
    byte Rating,
    string? Comment,
    DateTime CreatedAt,
    BranchImageDto? Image);

public sealed record OwnerBranchReviewsDto(
    Guid BranchId,
    double? AverageRating,
    int ReviewCount,
    PagedList<BranchReviewItemDto> Reviews);

public sealed record OwnerBranchListItemDto(
    Guid Id, string Name, string Hotline, string Province, string District, string Street,
    TimeOnly OpenTime, TimeOnly CloseTime, bool IsActive,
    IReadOnlyList<BranchSportDto> Sports, BranchImageDto? CoverImage,
    int ReviewCount, double? AverageRating);

public sealed record OwnerBranchDetailDto(
    Guid Id, string Name, string Hotline, string Province, string District, string Street,
    string GgMapUrl, decimal? Latitude, decimal? Longitude,
    TimeOnly OpenTime, TimeOnly CloseTime, string? Policy, bool IsActive,
    BranchImageDto QrImage, string AccountNumber, string AccountName,
    IReadOnlyList<BranchSportDto> Sports, IReadOnlyList<BranchImageDto> Images,
    int ReviewCount, double? AverageRating);

internal static class BranchDtoMapping
{
    public static OwnerBranchListItemDto ToListItem(this Branch branch)
    {
        var gallery = branch.Images.OrderBy(x => x.DisplayOrder).ToList();
        return new OwnerBranchListItemDto(
            branch.Id, branch.Name, branch.Hotline, branch.Province, branch.District,
            branch.Street, branch.OpenTime, branch.CloseTime, branch.IsActive,
            branch.BranchSportTypes.Select(x => new BranchSportDto(x.SportTypeId, x.SportType.Name)).ToList(),
            gallery.Count == 0 ? null : new BranchImageDto(gallery[0].ImageId, gallery[0].Image.StorageKey),
            branch.Reviews.Count,
            branch.Reviews.Count == 0 ? null : branch.Reviews.Average(x => (double)x.Rating));
    }

    public static OwnerBranchDetailDto ToDetail(this Branch branch) => new(
        branch.Id, branch.Name, branch.Hotline, branch.Province, branch.District,
        branch.Street, branch.GgMapUrl, branch.Latitude, branch.Longitude,
        branch.OpenTime, branch.CloseTime, branch.Policy, branch.IsActive,
        new BranchImageDto(branch.QrImageId, branch.QrImage.StorageKey),
        branch.AccountNumber, branch.AccountName,
        branch.BranchSportTypes.Select(x => new BranchSportDto(x.SportTypeId, x.SportType.Name)).ToList(),
        branch.Images.OrderBy(x => x.DisplayOrder)
            .Select(x => new BranchImageDto(x.ImageId, x.Image.StorageKey)).ToList(),
        branch.Reviews.Count,
        branch.Reviews.Count == 0 ? null : branch.Reviews.Average(x => (double)x.Rating));
}
