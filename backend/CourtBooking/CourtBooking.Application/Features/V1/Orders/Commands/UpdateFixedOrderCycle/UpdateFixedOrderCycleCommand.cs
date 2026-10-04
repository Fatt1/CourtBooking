using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateFixedOrderCycle;

/// <summary>
/// Command cập nhật một chu kì đặt sân cố định và tính toán lại các OrderDetail.
/// </summary>
public sealed record UpdateFixedOrderCycleCommand(
    Guid OrderId,
    Guid CycleId,
    Guid CourtTypeId,
    Guid PriceTableId,
    DateOnly StartDate,
    DateOnly EndDate,
    int DaysOfWeekMask,
    TimeOnly StartTime,
    TimeOnly EndTime,
    List<Guid> CourtIds,
    List<DateOnly>? ExceptionDates = null) : ICommand;
