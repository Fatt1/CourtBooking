using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Khung giờ cố định (Fixed Time Block) cho một CourtType - Aggregate Root độc lập.
/// Định nghĩa các slot giờ cố định theo ngày trong tuần (dạng bitmask) và các sân áp dụng.
/// Tham chiếu CourtType qua CourtTypeId (Guid).
/// </summary>
public class FixedTimeBlock : AggregateRoot<Guid>, IAuditable
{
    private FixedTimeBlock() { } // EF Core

    private readonly List<FixedTimeBlockCourt> _courts = [];

    public Guid CourtTypeId { get; private set; }

    /// <summary>
    /// Bitmask ngày trong tuần: bit 0 = Chủ nhật, bit 1 = Thứ hai, ..., bit 6 = Thứ bảy
    /// </summary>
    public int DaysOfWeekMask { get; private set; }

    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<FixedTimeBlockCourt> Courts => _courts.AsReadOnly();

    // --- Factory ---
    public static FixedTimeBlock Create(Guid courtTypeId, int daysOfWeekMask, TimeOnly startTime, TimeOnly endTime)
    {
        return new FixedTimeBlock
        {
            Id = Guid.NewGuid(),
            CourtTypeId = courtTypeId,
            DaysOfWeekMask = daysOfWeekMask,
            StartTime = startTime,
            EndTime = endTime
        };
    }

    // --- Domain Methods ---
    public void UpdateSchedule(int daysOfWeekMask, TimeOnly startTime, TimeOnly endTime) { }
    public void AssignCourt(Guid courtId) { }
    public void RemoveCourt(Guid courtId) { }
}

