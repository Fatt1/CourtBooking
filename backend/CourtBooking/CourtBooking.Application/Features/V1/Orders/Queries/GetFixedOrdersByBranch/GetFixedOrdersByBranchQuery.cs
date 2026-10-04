using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Orders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetFixedOrdersByBranch;

/// <summary>
/// Query lấy danh sách đơn hàng lịch cố định tại một chi nhánh có phân trang và bộ lọc.
/// </summary>
public sealed record GetFixedOrdersByBranchQuery(
    Guid BranchId,
    OrderStatus? Status = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    string? SearchTerm = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<FixedOrderDto>>;
