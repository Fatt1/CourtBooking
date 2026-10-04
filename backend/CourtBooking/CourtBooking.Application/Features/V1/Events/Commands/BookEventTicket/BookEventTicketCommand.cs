using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Events.Commands.BookEventTicket;

/// <summary>
/// Command đặt mua vé sự kiện thể thao dành cho Người chơi.
/// </summary>
public sealed record BookEventTicketCommand(
    Guid EventId,
    int Quantity,
    PaymentMethod PaymentMethod,
    Guid? ProofImageId = null) : ICommand<BookEventTicketResponse>;
