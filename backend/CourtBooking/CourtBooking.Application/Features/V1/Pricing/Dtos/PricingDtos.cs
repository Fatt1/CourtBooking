namespace CourtBooking.Application.Features.V1.Pricing.Dtos;

/// <summary>
/// DTO thông tin sân con được áp dụng khung giờ hoặc khả dụng.
/// </summary>
public sealed record AppliedCourtDto(
    Guid CourtId,
    string CourtName);

/// <summary>
/// DTO khung giờ bắt buộc (Fixed Time Block) đã được giải mã bitmask ngày trong tuần.
/// </summary>
public sealed record FixedTimeBlockDto(
    Guid Id,
    Guid CourtTypeId,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int DaysOfWeekMask,
    IReadOnlyList<int> DaysOfWeek,
    IReadOnlyList<string> DayNames,
    IReadOnlyList<AppliedCourtDto> AppliedCourts,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>
/// DTO quy tắc tính giá (Price Table Rule).
/// </summary>
public sealed record PriceTableRuleDto(
    Guid Id,
    Guid PriceTableId,
    DateOnly? StartDate,
    DateOnly? EndDate,
    byte DayOfWeekFrom,
    byte DayOfWeekTo,
    string DayOfWeekRangeText,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal FixedCustomerPrice,
    decimal WalkInCustomerPrice);

/// <summary>
/// DTO bảng giá (Price Table) chứa danh sách các quy tắc giá bên trong.
/// </summary>
public sealed record PriceTableDto(
    Guid Id,
    Guid CourtTypeId,
    string Name,
    bool IsActive,
    decimal DefaultPrice,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<PriceTableRuleDto> Rules);

/// <summary>
/// DTO tổng hợp toàn bộ cấu hình giá và khung giờ theo Loại sân (CourtType)
/// Dùng để render toàn bộ màn hình giao diện cấu hình mà không cần phân trang.
/// </summary>
public sealed record CourtTypePricingConfigDto(
    Guid CourtTypeId,
    Guid BranchId,
    string CourtTypeName,
    int MinutesConfig,
    IReadOnlyList<AppliedCourtDto> AvailableCourts,
    IReadOnlyList<FixedTimeBlockDto> FixedTimeBlocks,
    IReadOnlyList<PriceTableDto> PriceTables);

