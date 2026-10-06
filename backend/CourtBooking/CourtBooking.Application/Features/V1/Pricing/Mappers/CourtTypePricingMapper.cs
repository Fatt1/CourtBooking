using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Helpers;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Pricing.Mappers;

/// <summary>
/// Cung cấp các phương thức mở rộng (Extension Methods) để ánh xạ các thực thể cấu hình giá sang DTO.
/// Dùng chung cho cả luồng quản lý của Owner và luồng xem cấu hình đặt sân của Client.
/// </summary>
public static class CourtTypePricingMapper
{
    /// <summary>
    /// Ánh xạ một Loại sân (CourtType) kèm sân con, khung giờ bắt buộc và bảng giá sang DTO tổng hợp.
    /// </summary>
    /// <param name="courtType">Loại sân cần ánh xạ</param>
    /// <param name="onlyActive">Nếu là true (public), chỉ lấy sân không Inactive và bảng giá đang Active.</param>
    public static CourtTypePricingConfigDto ToPricingConfigDto(this CourtType courtType, bool onlyActive = false)
    {
        var courtsQuery = onlyActive
            ? courtType.Courts.Where(c => c.Status != CourtStatus.Inactive)
            : courtType.Courts;

        var availableCourts = courtsQuery
            .OrderBy(c => c.Name)
            .Select(c => new AppliedCourtDto(c.Id, c.Name))
            .ToList();

        var fixedTimeBlocks = courtType.FixedTimeBlocks
            .OrderBy(ftb => ftb.StartTime)
            .Select(ftb => ftb.ToDto(onlyActive))
            .ToList();

        var priceTablesQuery = onlyActive
            ? courtType.PriceTables.Where(pt => pt.IsActive)
            : courtType.PriceTables;

        var priceTables = priceTablesQuery
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
    public static FixedTimeBlockDto ToDto(this FixedTimeBlock ftb, bool onlyActive = false)
    {
        var daysOfWeek = DaysOfWeekMaskHelper.DecodeMask(ftb.DaysOfWeekMask);
        var dayNames = DaysOfWeekMaskHelper.DecodeMaskToNames(ftb.DaysOfWeekMask);

        var courtsQuery = onlyActive
            ? ftb.Courts.Where(c => c.Court == null || c.Court.Status != CourtStatus.Inactive)
            : ftb.Courts;

        var appliedCourts = courtsQuery
            .Select(c => new AppliedCourtDto(c.CourtId, c.Court != null ? c.Court.Name : string.Empty))
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
            .OrderBy(r => r.DayOfWeekFrom)
            .ThenBy(r => r.StartTime)
            .Select(r => r.ToDto())
            .ToList();

        return new PriceTableDto(
            pt.Id,
            pt.CourtTypeId,
            pt.Name,
            pt.IsActive,
            pt.DefaultPrice,
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
