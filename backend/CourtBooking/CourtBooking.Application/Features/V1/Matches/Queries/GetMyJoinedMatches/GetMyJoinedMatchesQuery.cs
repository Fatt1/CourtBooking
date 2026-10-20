using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Queries.GetMyJoinedMatches;

public sealed record GetMyJoinedMatchesQuery(
    decimal? Latitude = null,
    decimal? Longitude = null) : IQuery<List<MatchDto>>;
