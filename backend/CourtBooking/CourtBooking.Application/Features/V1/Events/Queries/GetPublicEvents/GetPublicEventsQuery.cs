using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Events.Queries.GetPublicEvents;

/// <summary>
/// Query lấy danh sách sự kiện công khai dành cho Người chơi (Client) có lọc và phân trang.
/// </summary>
public sealed record GetPublicEventsQuery(
    string? SearchTerm = null,
    Guid? SportTypeId = null,
    Guid? BranchId = null,
    DateOnly? Date = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<EventCardDto>>;
