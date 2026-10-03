using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.RejectEventTicket;

public sealed record RejectEventTicketCommand(
    Guid EventId,
    Guid TicketId,
    string Reason) : ICommand;
