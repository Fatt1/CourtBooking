using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddFixedOrderCycle;

/// <summary>
/// Command thêm một chu kì mới vào đơn đặt lịch cố định.
/// </summary>
public sealed record AddFixedOrderCycleCommand(
    Guid OrderId,
    Guid CourtTypeId,
    Guid PriceTableId,
    DateOnly StartDate,
    DateOnly EndDate,
    int DaysOfWeekMask,
    TimeOnly StartTime,
    TimeOnly EndTime,
    List<Guid> CourtIds,
    List<DateOnly>? ExceptionDates = null) : ICommand<Guid>;
