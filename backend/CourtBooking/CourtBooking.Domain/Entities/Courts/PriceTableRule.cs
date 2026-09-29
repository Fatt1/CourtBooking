using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Quy tắc giá cụ thể trong bảng giá.
/// </summary>
public class PriceTableRule : EntityBase<Guid>
{
    public PriceTableRule() { }

    public Guid PriceTableId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    /// <summary>Thứ trong tuần bắt đầu áp dụng (0 = Chủ nhật, 6 = Thứ bảy)</summary>
    public byte DayOfWeekFrom { get; set; }

    /// <summary>Thứ trong tuần kết thúc áp dụng</summary>
    public byte DayOfWeekTo { get; set; }

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal FixedCustomerPrice { get; set; }
    public decimal WalkInCustomerPrice { get; set; }

    // Navigation
    public PriceTable PriceTable { get; set; } = null!;
}
