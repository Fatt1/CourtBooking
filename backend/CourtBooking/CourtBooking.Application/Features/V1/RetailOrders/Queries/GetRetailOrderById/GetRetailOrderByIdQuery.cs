using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrderById;

public sealed record GetRetailOrderByIdQuery(Guid Id) : IQuery<RetailOrderDto>;
