namespace CourtBooking.Application.Features.V1.Orders.SharedInputs;

/// <summary>
/// Cấu hình cho một chu kì đặt sân cố định.
/// </summary>
/// <param name="CourtTypeId">ID loại sân áp dụng cho chu kì</param>
/// <param name="PriceTableId">ID bảng giá áp dụng cho chu kì</param>
/// <param name="StartDate">Ngày bắt đầu áp dụng chu kì</param>
/// <param name="EndDate">Ngày kết thúc áp dụng chu kì</param>
/// <param name="DaysOfWeekMask">Bitmask các thứ trong tuần áp dụng (bit 0 = CN, bit 1 = T2, ..., bit 6 = T7)</param>
/// <param name="StartTime">Giờ bắt đầu áp dụng chung cho các sân trong chu kì</param>
/// <param name="EndTime">Giờ kết thúc áp dụng chung cho các sân trong chu kì</param>
/// <param name="CourtIds">Danh sách ID các sân thuộc chu kì này (cùng loại sân và cùng khung giờ)</param>
/// <param name="ExceptionDates">Danh sách các ngày loại trừ không tính đặt sân</param>
public sealed record FixedCycleInput(
    Guid CourtTypeId,
    Guid PriceTableId,
    DateOnly StartDate,
    DateOnly EndDate,
    int DaysOfWeekMask,
    TimeOnly StartTime,
    TimeOnly EndTime,
    List<Guid> CourtIds,
    List<DateOnly>? ExceptionDates = null);
