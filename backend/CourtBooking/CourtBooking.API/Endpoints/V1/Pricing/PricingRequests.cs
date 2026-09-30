namespace CourtBooking.API.Endpoints.V1.Pricing;

/// <summary>
/// Request tạo bảng giá mới cho Loại sân.
/// </summary>
public sealed record CreatePriceTableRequest(
    Guid CourtTypeId,
    string Name,
    decimal DefaultPrice,
    bool IsActive = true);

/// <summary>
/// Request cập nhật thông tin bảng giá.
/// </summary>
public sealed record UpdatePriceTableRequest(
    string Name,
    decimal DefaultPrice,
    bool IsActive);

/// <summary>
/// Request tạo quy tắc tính giá mới trong bảng giá.
/// </summary>
public sealed record CreatePriceTableRuleRequest(
    DateOnly? StartDate,
    DateOnly? EndDate,
    byte DayOfWeekFrom,
    byte DayOfWeekTo,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal FixedCustomerPrice,
    decimal WalkInCustomerPrice);

/// <summary>
/// Request cập nhật quy tắc tính giá trong bảng giá.
/// </summary>
public sealed record UpdatePriceTableRuleRequest(
    DateOnly? StartDate,
    DateOnly? EndDate,
    byte DayOfWeekFrom,
    byte DayOfWeekTo,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal FixedCustomerPrice,
    decimal WalkInCustomerPrice);

/// <summary>
/// Request tạo khung giờ bắt buộc liền mạch (Fixed Time Block).
/// </summary>
public sealed record CreateFixedTimeBlockRequest(
    Guid CourtTypeId,
    TimeOnly StartTime,
    TimeOnly EndTime,
    List<int> DaysOfWeek,
    List<Guid> CourtIds);
