using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Queries.GetMatchById;

public sealed record GetMatchByIdQuery(Guid Id) : IQuery<MatchDetailDto>;
