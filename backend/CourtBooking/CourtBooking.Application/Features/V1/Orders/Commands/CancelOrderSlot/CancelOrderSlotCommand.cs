using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderSlot;

public sealed record CancelOrderSlotCommand(
    Guid OrderId,
    Guid OrderDetailId,
    decimal? RefundAmount = null,
    PaymentMethod? RefundMethod = null,
    string? CancelReason = null) : ICommand;
