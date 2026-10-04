using System.Globalization;
using System.Text.Json;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;

namespace CourtBooking.Application.Features.V1.Orders.Common;

/// <summary>
/// Helper tiện ích cho chu kì đặt sân cố định.
/// </summary>
public static class FixedCycleHelper
{
    /// <summary>
    /// Chuyển đổi danh sách ngày loại trừ sang chuỗi phân cách dấu phẩy.
    /// </summary>
    public static string? FormatExceptionDates(List<DateOnly>? dates)
    {
        if (dates == null || dates.Count == 0)
        {
            return null;
        }

        return string.Join(",", dates.Distinct().OrderBy(d => d).Select(d => d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)));
    }

    /// <summary>
    /// Phân tích chuỗi ngày loại trừ (hỗ trợ phân cách dấu phẩy hoặc mảng JSON).
    /// </summary>
    public static List<DateOnly> ParseExceptionDates(string? exceptionDates)
    {
        if (string.IsNullOrWhiteSpace(exceptionDates))
        {
            return [];
        }

        var trimmed = exceptionDates.Trim();
        if (trimmed.StartsWith('['))
        {
            try
            {
                var jsonDates = JsonSerializer.Deserialize<List<DateOnly>>(trimmed);
                if (jsonDates != null)
                {
                    return jsonDates;
                }
            }
            catch
            {
                // Fallback nếu không parse được JSON
            }
        }

        return trimmed
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => DateOnly.TryParse(s, CultureInfo.InvariantCulture, out var d) ? (DateOnly?)d : null)
            .Where(d => d.HasValue)
            .Select(d => d!.Value)
            .Distinct()
            .ToList();
    }

    /// <summary>
    /// Sinh toàn bộ các slot đặt sân cho một chu kì.
    /// </summary>
    public static List<(Guid CourtId, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime)> GenerateSlots(FixedCycleInput cycle)
    {
        var slots = new List<(Guid CourtId, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime)>();
        var exceptionSet = new HashSet<DateOnly>(cycle.ExceptionDates ?? []);

        var current = cycle.StartDate;
        while (current <= cycle.EndDate)
        {
            if (!exceptionSet.Contains(current))
            {
                int dayBit = 1 << (int)current.DayOfWeek;
                if ((cycle.DaysOfWeekMask & dayBit) != 0)
                {
                    foreach (var courtId in cycle.CourtIds)
                    {
                        slots.Add((courtId, current, cycle.StartTime, cycle.EndTime));
                    }
                }
            }

            current = current.AddDays(1);
        }

        return slots;
    }
}
