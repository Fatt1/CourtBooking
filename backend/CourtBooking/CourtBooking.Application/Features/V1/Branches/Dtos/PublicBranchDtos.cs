using CourtBooking.Application.Features.V1.Storages.Dtos;

namespace CourtBooking.Application.Features.V1.Branches.Dtos;

public sealed record PublicBranchListItemDto(
    Guid Id,
    string Name,
    string FullAddress,
    ImageDto? CoverImage,
    IReadOnlyList<BranchSportDto> Sports,
    TimeOnly OpenTime,
    TimeOnly CloseTime,
    double ReviewAverage,
    double? DistanceKm,
    int? AvailableCourtCount,
    decimal MinPrice,
    decimal MaxPrice);

public sealed record PublicBranchDetailDto(
    Guid Id,
    string Name,
    string Hotline,
    string Province,
    string District,
    string Street,
    string GgMapUrl,
    TimeOnly OpenTime,
    TimeOnly CloseTime,
    string? Policy,
    decimal? MinPrice,
    decimal? MaxPrice,
    double ReviewAverage,
    IReadOnlyList<ImageDto> Images,
    IReadOnlyList<BranchSportDto> Sports);
