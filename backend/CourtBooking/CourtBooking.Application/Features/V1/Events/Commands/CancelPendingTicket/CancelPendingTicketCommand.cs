using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Events.Commands.CancelPendingTicket;

/// <summary>
/// Command hủy đơn giữ vé sự kiện khi người dùng tắt popup hoặc chọn hủy thanh toán.
/// Tự động hoàn lại AvailableSlot cho sự kiện để tránh spam giữ slot.
/// </summary>
public sealed record CancelPendingTicketCommand(
    Guid EventId,
    Guid TicketId) : ICommand;
