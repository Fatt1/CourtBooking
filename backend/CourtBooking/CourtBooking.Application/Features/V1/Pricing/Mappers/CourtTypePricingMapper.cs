using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Helpers;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Pricing.Mappers;

/// <summary>
/// Cung cấp các phương thức mở rộng (Extension Methods) để ánh xạ các thực thể cấu hình giá sang DTO.
/// Dùng chung cho cả luồng quản lý của Owner và luồng xem cấu hình đặt sân của Client.
/// Mapper chỉ chịu trách nhiệm chuyển đổi dữ liệu (việc lọc active/inactive do tầng truy vấn đảm nhiệm).
/// </summary>
public static class CourtTypePricingMapper
{
    /// <summary>
    /// Ánh xạ một Loại sân (CourtType) kèm sân con, khung giờ bắt buộc và bảng giá sang DTO tổng hợp.
    /// </summary>
    public static CourtTypePricingConfigDto ToPricingConfigDto(this CourtType courtType)
    {
        var availableCourts = courtType.Courts
            .OrderBy(c => c.Name)
            .Select(c => new AppliedCourtDto(c.Id, c.Name, c.Status))
            .ToList();

        var fixedTimeBlocks = courtType.FixedTimeBlocks
            .OrderBy(ftb => ftb.StartTime)
            .Select(ftb => ftb.ToDto())
            .ToList();

        var priceTables = courtType.PriceTables
            .OrderByDescending(pt => pt.IsActive)
            .ThenBy(pt => pt.Name)
            .Select(pt => pt.ToDto())
            .ToList();

        return new CourtTypePricingConfigDto(
            courtType.Id,
            courtType.BranchId,
            courtType.Name,
            courtType.MinutesConfig,
            availableCourts,
            fixedTimeBlocks,
            priceTables);
    }

    /// <summary>
    /// Ánh xạ Khung giờ bắt buộc (FixedTimeBlock) sang DTO kèm giải mã bitmask ngày trong tuần.
    /// </summary>
    public static FixedTimeBlockDto ToDto(this FixedTimeBlock ftb)
    {
        // Chỉ giải mã bitmask 1 lần, sau đó chuyển đổi sang tên thứ
        var daysOfWeek = DaysOfWeekMaskHelper.DecodeMask(ftb.DaysOfWeekMask);
        var dayNames = daysOfWeek.Select(DaysOfWeekMaskHelper.GetDayName).ToList();

        var appliedCourts = ftb.Courts
            .Select(c => new AppliedCourtDto(
                c.CourtId,
                c.Court != null ? c.Court.Name : string.Empty,
                c.Court != null ? c.Court.Status : CourtStatus.Available))
            .OrderBy(c => c.CourtName)
            .ToList();

        return new FixedTimeBlockDto(
            ftb.Id,
            ftb.CourtTypeId,
            ftb.StartTime,
            ftb.EndTime,
            ftb.DaysOfWeekMask,
            daysOfWeek,
            dayNames,
            appliedCourts);
    }

    /// <summary>
    /// Ánh xạ Bảng giá (PriceTable) kèm danh sách các quy tắc giá bên trong sang DTO.
    /// </summary>
    public static PriceTableDto ToDto(this PriceTable pt)
    {
        var rules = pt.Rules
            .OrderBy(r => (r.StartDate.HasValue || r.EndDate.HasValue) ? 0 : 1) // Rule có ngày cụ thể lên trước
            .ThenBy(r => r.StartDate)
            .ThenBy(r => r.DayOfWeekFrom)
            .ThenBy(r => r.StartTime)
            .Select(r => r.ToDto())
            .ToList();

        return new PriceTableDto(
            pt.Id,
            pt.CourtTypeId,
            pt.Name,
            pt.IsActive,
            pt.DefaultPrice,
            pt.DefaultWalkInPrice,
            rules);
    }

    /// <summary>
    /// Ánh xạ Quy tắc tính giá (PriceTableRule) sang DTO kèm format chuỗi phạm vi ngày.
    /// </summary>
    public static PriceTableRuleDto ToDto(this PriceTableRule rule)
    {
        return new PriceTableRuleDto(
            rule.Id,
            rule.PriceTableId,
            rule.StartDate,
            rule.EndDate,
            rule.DayOfWeekFrom,
            rule.DayOfWeekTo,
            DaysOfWeekMaskHelper.GetDayRangeText(rule.DayOfWeekFrom, rule.DayOfWeekTo),
            rule.StartTime,
            rule.EndTime,
            rule.FixedCustomerPrice,
            rule.WalkInCustomerPrice);
    }
}
