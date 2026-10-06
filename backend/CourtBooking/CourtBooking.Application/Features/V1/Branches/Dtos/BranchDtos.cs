using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Storages.Dtos;

namespace CourtBooking.Application.Features.V1.Branches.Dtos;

public sealed record BranchSportDto(Guid Id, string Name);

public sealed record BranchReviewItemDto(
    Guid Id,
    string PlayerName,
    byte Rating,
    string? Comment,
    DateTime CreatedAt,
    ImageDto? Image = null);

public sealed record OwnerBranchReviewsDto(
    Guid BranchId,
    double? AverageRating,
    PagedList<BranchReviewItemDto> Reviews);

public sealed record OwnerBranchListItemDto(
    Guid Id, string Name, string Hotline, string Province, string District, string Street,
    TimeOnly OpenTime, TimeOnly CloseTime, bool IsActive,
    double? AverageRating);

public sealed record OwnerBranchDetailDto(
    Guid Id, string Name, string Hotline, string Province, string District, string Street,
    string GgMapUrl, decimal? Latitude, decimal? Longitude,
    TimeOnly OpenTime, TimeOnly CloseTime, string? Policy, bool IsActive,
    ImageDto QrImage, string AccountNumber, string AccountName,
    IReadOnlyList<BranchSportDto> Sports, IReadOnlyList<ImageDto> Images,
    double? AverageRating);


