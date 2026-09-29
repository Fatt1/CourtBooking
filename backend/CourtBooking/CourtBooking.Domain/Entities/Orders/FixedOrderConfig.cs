using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Cấu hình đặt sân cố định (theo tuần/tháng).
/// </summary>
public class FixedOrderConfig : EntityBase<Guid>
{
    public FixedOrderConfig() { }

    public Guid OrderId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    /// <summary>
    /// Bitmask ngày trong tuần: bit 0 = Chủ nhật, bit 1 = Thứ hai, ..., bit 6 = Thứ bảy
    /// </summary>
    public int DaysOfWeekMask { get; set; }

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    /// <summary>Danh sách ngày ngoại lệ (không áp dụng), lưu dạng JSON hoặc CSV</summary>
    public string? ExceptionDates { get; set; }

    public List<FixedOrderConfigCourt> Courts { get; set; } = [];

    // Navigation
    public Order Order { get; set; } = null!;
}
