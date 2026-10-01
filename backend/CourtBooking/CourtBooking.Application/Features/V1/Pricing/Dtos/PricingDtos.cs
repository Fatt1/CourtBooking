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

/// <summary>
/// Helper tiện ích cho việc tính toán và giải mã bitmask ngày trong tuần (0 = Chủ nhật, 1 = Thứ hai, ..., 6 = Thứ bảy).
/// </summary>
public static class DaysOfWeekMaskHelper
{
    public static int ComputeMask(IEnumerable<int> days)
    {
        int mask = 0;
        foreach (var day in days)
        {
            if (day >= 0 && day <= 6)
            {
                mask |= (1 << day);
            }
        }
        return mask;
    }

    public static List<int> DecodeMask(int mask)
    {
        var days = new List<int>();
        for (int i = 0; i <= 6; i++)
        {
            if ((mask & (1 << i)) != 0)
            {
                days.Add(i);
            }
        }
        return days;
    }

    public static string GetDayName(int day) => day switch
    {
        0 => "Chủ nhật",
        1 => "Thứ hai",
        2 => "Thứ ba",
        3 => "Thứ tư",
        4 => "Thứ năm",
        5 => "Thứ sáu",
        6 => "Thứ bảy",
        _ => $"Thứ {day}"
    };

    public static List<string> DecodeMaskToNames(int mask)
    {
        return DecodeMask(mask).Select(GetDayName).ToList();
    }

    public static string GetDayRangeText(byte from, byte to)
    {
        if (from == to)
        {
            return GetDayName(from);
        }
        return $"{GetDayName(from)} - {GetDayName(to)}";
    }

    public static bool IsDayMatching(byte day, byte from, byte to)
    {
        return from <= to
            ? (day >= from && day <= to)
            : (day >= from || day <= to);
    }
}
