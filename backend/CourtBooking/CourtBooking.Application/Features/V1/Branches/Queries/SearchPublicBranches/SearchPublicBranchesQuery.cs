using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Queries.SearchPublicBranches;

public sealed record SearchPublicBranchesQuery(
    string? Search = null,
    string? Province = null,
    string? District = null,
    IReadOnlyList<Guid>? SportTypeIds = null,
    DateOnly? Date = null,
    TimeOnly? StartTime = null,
    TimeOnly? EndTime = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    double? Rating = null,
    string? Sort = null,
    decimal? Latitude = null,
    decimal? Longitude = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<PublicBranchListItemDto>>;
