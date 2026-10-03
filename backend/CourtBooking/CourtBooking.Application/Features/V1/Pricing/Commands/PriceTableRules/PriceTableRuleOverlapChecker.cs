using CourtBooking.Application.Helpers;
using CourtBooking.Domain.Entities.Courts;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules;

/// <summary>
/// Helper kiểm tra chồng lấn thời gian, thứ trong tuần và khoảng ngày giữa các quy tắc tính giá (PriceTableRule).
/// </summary>
public static class PriceTableRuleOverlapChecker
{
    public static bool HasOverlap(
        IEnumerable<PriceTableRule> existingRules,
        DateOnly? startDate,
        DateOnly? endDate,
        byte dayOfWeekFrom,
        byte dayOfWeekTo,
        TimeOnly startTime,
        TimeOnly endTime,
        Guid? ignoreRuleId = null)
    {
        foreach (var rule in existingRules)
        {
            if (ignoreRuleId.HasValue && rule.Id == ignoreRuleId.Value)
            {
                continue;
            }

            // 1. Kiểm tra chồng lấn thời gian trong ngày (Time overlap)
            if (startTime >= rule.EndTime || endTime <= rule.StartTime)
            {
                continue;
            }

            // 2. Kiểm tra trùng thứ trong tuần (Day of week overlap: 0 = CN, ..., 6 = T7)
            bool dayOverlaps = false;
            for (byte day = 0; day <= 6; day++)
            {
                if (DaysOfWeekMaskHelper.IsDayMatching(day, dayOfWeekFrom, dayOfWeekTo) &&
                    DaysOfWeekMaskHelper.IsDayMatching(day, rule.DayOfWeekFrom, rule.DayOfWeekTo))
                {
                    dayOverlaps = true;
                    break;
                }
            }

            if (!dayOverlaps)
            {
                continue;
            }

            // 3. Kiểm tra chồng lấn khoảng ngày hiệu lực (Date range overlap)
            var s1 = startDate ?? DateOnly.MinValue;
            var e1 = endDate ?? DateOnly.MaxValue;
            var s2 = rule.StartDate ?? DateOnly.MinValue;
            var e2 = rule.EndDate ?? DateOnly.MaxValue;

            if (s1 <= e2 && e1 >= s2)
            {
                return true; // Xung đột
            }
        }

        return false;
    }
}
