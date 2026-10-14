using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CompleteOrder;

public sealed record CompleteOrderCommand(
    Guid OrderId
) : ICommand;
