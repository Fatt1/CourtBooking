namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Join table giữa FixedTimeBlock và Court (Composite Key: FixedTimeBlockId, CourtId).
/// </summary>
public class FixedTimeBlockCourt
{
    private FixedTimeBlockCourt() { } // EF Core

    public Guid FixedTimeBlockId { get; private set; }
    public Guid CourtId { get; private set; }

    // Navigation
    public FixedTimeBlock FixedTimeBlock { get; private set; } = null!;
    public Court Court { get; private set; } = null!;

    internal static FixedTimeBlockCourt Create(Guid fixedTimeBlockId, Guid courtId)
    {
        return new FixedTimeBlockCourt
        {
            FixedTimeBlockId = fixedTimeBlockId,
            CourtId = courtId
        };
    }
}
