using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Quy tắc giá cụ thể trong bảng giá.
/// Child entity của PriceTable.
/// </summary>
public class PriceTableRule : EntityBase<Guid>
{
    private PriceTableRule() { } // EF Core

    public Guid PriceTableId { get; private set; }
    public DateOnly? StartDate { get; private set; }
    public DateOnly? EndDate { get; private set; }

    /// <summary>Thứ trong tuần bắt đầu áp dụng (0 = Chủ nhật, 6 = Thứ bảy)</summary>
    public byte DayOfWeekFrom { get; private set; }

    /// <summary>Thứ trong tuần kết thúc áp dụng</summary>
    public byte DayOfWeekTo { get; private set; }

    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public decimal FixedCustomerPrice { get; private set; }
    public decimal WalkInCustomerPrice { get; private set; }

    // Navigation
    public PriceTable PriceTable { get; private set; } = null!;

    internal static PriceTableRule Create(
        Guid priceTableId,
        byte dayOfWeekFrom, byte dayOfWeekTo,
        TimeOnly startTime, TimeOnly endTime,
        decimal fixedCustomerPrice, decimal walkInCustomerPrice,
        DateOnly? startDate = null, DateOnly? endDate = null)
    {
        return new PriceTableRule
        {
            Id = Guid.NewGuid(),
            PriceTableId = priceTableId,
            DayOfWeekFrom = dayOfWeekFrom,
            DayOfWeekTo = dayOfWeekTo,
            StartTime = startTime,
            EndTime = endTime,
            FixedCustomerPrice = fixedCustomerPrice,
            WalkInCustomerPrice = walkInCustomerPrice,
            StartDate = startDate,
            EndDate = endDate
        };
    }
}
