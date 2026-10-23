using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetMyOrders;

public sealed record GetMyOrdersQuery(
    OrderStatus? Status = null,
    int Page = 1,
    int PageSize = 5) : PaginationQuery(Page, PageSize), IQuery<PagedList<MyOrderDto>>;
