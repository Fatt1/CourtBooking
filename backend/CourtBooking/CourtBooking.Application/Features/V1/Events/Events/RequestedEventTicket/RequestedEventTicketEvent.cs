using MediatR;

namespace CourtBooking.Application.Features.V1.Events.Events.RequestedEventTicket;

public sealed record RequestedEventTicketEvent(
    Guid TicketId,
    Guid EventId,
    string EventTitle,
    Guid BranchId,
    string BranchName,
    Guid CourtOwnerId,
    string PlayerName,
    int Quantity,
    decimal TotalPrice,
    DateTime CreatedAt
) : INotification;
