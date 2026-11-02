using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderOnline;

public sealed record CancelOrderOnlineCommand(
    Guid OrderId,
    string? CancelReason = null,
    string? Reason = null) : ICommand
{
    public string? ResolvedCancelReason => !string.IsNullOrWhiteSpace(CancelReason)
        ? CancelReason
        : (!string.IsNullOrWhiteSpace(Reason) ? Reason : null);
}

