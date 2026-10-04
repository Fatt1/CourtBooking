namespace CourtBooking.Application.Helpers;

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
        0 => "CN",
        1 => "T2",
        2 => "T3",
        3 => "T4",
        4 => "T5",
        5 => "T6",
        6 => "T7",
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
