using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Matches.Queries.GetMatches;

public sealed record GetMatchesQuery(
    decimal? Latitude = null,
    decimal? Longitude = null,
    Guid? SportTypeId = null,
    string? SkillLevel = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<MatchDto>>;
