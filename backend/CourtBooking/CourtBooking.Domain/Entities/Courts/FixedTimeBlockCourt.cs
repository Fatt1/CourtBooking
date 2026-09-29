namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Join table giữa FixedTimeBlock và Court (Composite Key: FixedTimeBlockId, CourtId).
/// </summary>
public class FixedTimeBlockCourt
{
    public FixedTimeBlockCourt() { }

    public Guid FixedTimeBlockId { get; set; }
    public Guid CourtId { get; set; }

    // Navigation
    public FixedTimeBlock FixedTimeBlock { get; set; } = null!;
    public Court Court { get; set; } = null!;
}
