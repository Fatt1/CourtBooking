using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Matches.Queries.GetMatches;

public sealed record GetMatchesQuery(
    Guid? SportTypeId = null,
    DateOnly? Date = null,
    string? Province = null,
    string? District = null,
    string? SkillLevel = null,
    SocialMatchStatus? Status = SocialMatchStatus.Open,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<MatchDto>>;
