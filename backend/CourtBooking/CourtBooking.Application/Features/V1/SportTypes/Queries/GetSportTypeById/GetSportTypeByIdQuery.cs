using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypeById;

public sealed record GetSportTypeByIdQuery(Guid Id) : IQuery<SportTypeDto>;