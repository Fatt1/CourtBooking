using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Cấu hình đặt sân cố định (theo tuần/tháng) - Child entity của Order aggregate.
/// </summary>
public class FixedOrderConfig : EntityBase<Guid>
{
    private FixedOrderConfig() { } // EF Core

    private readonly List<FixedOrderConfigCourt> _courts = [];

    public Guid OrderId { get; private set; }
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }

    /// <summary>
    /// Bitmask ngày trong tuần: bit 0 = Chủ nhật, bit 1 = Thứ hai, ..., bit 6 = Thứ bảy
    /// </summary>
    public int DaysOfWeekMask { get; private set; }

    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }

    /// <summary>Danh sách ngày ngoại lệ (không áp dụng), lưu dạng JSON hoặc CSV</summary>
    public string? ExceptionDates { get; private set; }

    public IReadOnlyList<FixedOrderConfigCourt> Courts => _courts.AsReadOnly();

    // Navigation
    public Order Order { get; private set; } = null!;

    // --- Factory ---
    internal static FixedOrderConfig Create(
        Guid orderId,
        DateOnly startDate,
        DateOnly endDate,
        int daysOfWeekMask,
        TimeOnly startTime,
        TimeOnly endTime,
        string? exceptionDates = null)
    {
        return new FixedOrderConfig
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            StartDate = startDate,
            EndDate = endDate,
            DaysOfWeekMask = daysOfWeekMask,
            StartTime = startTime,
            EndTime = endTime,
            ExceptionDates = exceptionDates
        };
    }

    // --- Domain Methods ---
    internal void AddCourt(Guid courtId) { }
    internal void RemoveCourt(Guid courtId) { }
    internal void UpdateSchedule(int daysOfWeekMask, TimeOnly startTime, TimeOnly endTime) { }
    internal void AddExceptionDate(DateOnly date) { }
    internal void Extend(DateOnly newEndDate) { }
}
