using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrders;

public sealed record GetRetailOrdersQuery(
    Guid? BranchId = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    PaymentMethod? PaymentMethod = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<RetailOrderListItemDto>>;
