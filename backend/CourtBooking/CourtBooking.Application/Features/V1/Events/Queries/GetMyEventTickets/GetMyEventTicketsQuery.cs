using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Events.Queries.GetMyEventTickets;

/// <summary>
/// Query lấy danh sách vé sự kiện của người chơi hiện tại (kèm phân trang và lọc trạng thái)
/// </summary>
public sealed record GetMyEventTicketsQuery(
    EventTicketStatus? Status = null,
    int Page = 1,
    int PageSize = 10) : IQuery<PagedList<MyEventTicketDto>>;
