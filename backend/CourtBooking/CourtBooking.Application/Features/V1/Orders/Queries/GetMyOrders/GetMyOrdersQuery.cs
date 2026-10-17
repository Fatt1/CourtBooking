using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetMyOrders;

public sealed record GetMyOrdersQuery(bool? OnlyAvailableForMatch = false) : IQuery<List<MyOrderDto>>;
