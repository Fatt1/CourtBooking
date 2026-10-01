using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.ConfirmOrder;

public sealed record ConfirmOrderCommand(
    Guid OrderId
    ) : ICommand;

