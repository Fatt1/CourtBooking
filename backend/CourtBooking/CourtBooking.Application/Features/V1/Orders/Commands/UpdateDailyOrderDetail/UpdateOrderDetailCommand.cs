using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderDetail;

public sealed record UpdateOrderDetailCommand(
    Guid OrderId,
    List<CourtBookingSlot> CourtBookingSlots
    ) : ICommand;

