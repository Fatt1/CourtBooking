using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.SportTypes.Queries.GetAdminSportTypes;

public sealed record GetAdminSportTypesQuery
    : IQuery<IReadOnlyList<AdminSportTypeDto>>;