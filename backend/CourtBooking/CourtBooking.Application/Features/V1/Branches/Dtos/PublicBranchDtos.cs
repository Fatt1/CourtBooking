namespace CourtBooking.Application.Features.V1.Branches.Dtos;

public sealed record PublicCourtTypeSummaryDto(
    Guid Id,
    string Name,
    int MinutesConfig,
    int? AvailableCourtCount,
    decimal? MinPrice);

public sealed record PublicBranchListItemDto(
    Guid Id,
    string Name,
    string Province,
    string District,
    string Street,
    decimal? Latitude,
    decimal? Longitude,
    BranchImageDto? CoverImage,
    IReadOnlyList<BranchSportDto> Sports,
    IReadOnlyList<PublicCourtTypeSummaryDto> CourtTypes,
    TimeOnly OpenTime,
    TimeOnly CloseTime,
    double? AverageRating,
    int ReviewCount,
    double? DistanceKm,
    int? AvailableCourtCount,
    decimal? MinPrice,
    IReadOnlyList<string> Services);

public sealed record PublicCourtTypeDetailDto(
    Guid Id,
    string Name,
    int MinutesConfig,
    int AvailableCourtCount,
    decimal? MinPrice);

public sealed record PublicBranchServiceDto(
    Guid Id,
    string Name,
    string Unit,
    decimal Price,
    BranchImageDto? Image);

public sealed record PublicBranchDetailDto(
    Guid Id,
    string Name,
    string Hotline,
    string Province,
    string District,
    string Street,
    string GgMapUrl,
    decimal? Latitude,
    decimal? Longitude,
    TimeOnly OpenTime,
    TimeOnly CloseTime,
    string? Policy,
    IReadOnlyList<BranchImageDto> Images,
    IReadOnlyList<BranchSportDto> Sports,
    IReadOnlyList<PublicCourtTypeDetailDto> CourtTypes,
    IReadOnlyList<PublicBranchServiceDto> Services,
    double? AverageRating,
    int ReviewCount);
