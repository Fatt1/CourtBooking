using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetServiceById;

public sealed record GetServiceByIdQuery(Guid Id) : IQuery<OwnerServiceDto>;
