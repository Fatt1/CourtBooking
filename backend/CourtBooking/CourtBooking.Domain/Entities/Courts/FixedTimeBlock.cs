using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Khung giờ cố định (Fixed Time Block) cho một CourtType
/// </summary>
public class FixedTimeBlock : EntityBase<Guid>, IAuditable
{
    public FixedTimeBlock() { }

    public Guid CourtTypeId { get; set; }

    /// <summary>
    /// Bitmask ngày trong tuần: bit 0 = Chủ nhật, bit 1 = Thứ hai, ..., bit 6 = Thứ bảy
    /// </summary>
    public int DaysOfWeekMask { get; set; }

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public CourtType CourtType { get; set; } = null!;
    public List<FixedTimeBlockCourt> Courts { get; set; } = [];
}
