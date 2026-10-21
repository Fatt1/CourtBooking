using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderOnline;

public sealed record CancelOrderOnlineCommand(
    Guid OrderId,
    string? CancelReason = null) : ICommand;
