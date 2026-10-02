using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypes;

public sealed record GetSportTypesQuery
    : IQuery<IReadOnlyList<SportTypeDto>>;