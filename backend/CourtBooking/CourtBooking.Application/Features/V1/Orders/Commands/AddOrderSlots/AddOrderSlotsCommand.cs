using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddOrderSlots;

/// <summary>
/// Command thêm các ngày/ca lẻ vào đơn hàng (đơn ngày hoặc đơn cố định).
/// </summary>
public sealed record AddOrderSlotsCommand(
    Guid OrderId,
    List<CourtBookingSlot> CourtSlots) : ICommand;
