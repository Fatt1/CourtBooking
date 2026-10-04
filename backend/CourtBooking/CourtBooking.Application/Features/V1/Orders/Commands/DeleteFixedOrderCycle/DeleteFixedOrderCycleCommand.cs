using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.DeleteFixedOrderCycle;

/// <summary>
/// Command xóa một chu kì khỏi đơn đặt lịch cố định.
/// </summary>
public sealed record DeleteFixedOrderCycleCommand(
    Guid OrderId,
    Guid CycleId) : ICommand;
