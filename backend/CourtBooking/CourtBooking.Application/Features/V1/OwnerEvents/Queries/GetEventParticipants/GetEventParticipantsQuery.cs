using CourtBooking.Application.Features.V1.OwnerEvents.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetEventParticipants;

/// <summary>
/// Query lấy danh sách người tham gia & duyệt chuyển khoản trong Modal "Người tham gia: [Tên Sự Kiện]".
/// </summary>
public sealed record GetEventParticipantsQuery(
    Guid EventId,
    EventTicketStatus? Status = null) : IQuery<EventParticipantsResponse>;
