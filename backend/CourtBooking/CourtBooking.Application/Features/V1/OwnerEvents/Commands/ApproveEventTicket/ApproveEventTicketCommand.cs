using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.ApproveEventTicket;

public sealed record ApproveEventTicketCommand(
    Guid EventId,
    Guid TicketId) : ICommand;
