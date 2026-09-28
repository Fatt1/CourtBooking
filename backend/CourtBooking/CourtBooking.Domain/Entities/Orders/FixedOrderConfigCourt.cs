namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Bảng liên kết giữa cấu hình đặt cố định và sân áp dụng (Composite Key: FixedOrderConfigId, CourtId).
/// Child entity của FixedOrderConfig aggregate.
/// </summary>
public class FixedOrderConfigCourt
{
    private FixedOrderConfigCourt() { } // EF Core

    public Guid FixedOrderConfigId { get; private set; }
    public Guid CourtId { get; private set; }

    // Navigation
    public FixedOrderConfig FixedOrderConfig { get; private set; } = null!;

    internal static FixedOrderConfigCourt Create(Guid fixedOrderConfigId, Guid courtId)
    {
        return new FixedOrderConfigCourt
        {
            FixedOrderConfigId = fixedOrderConfigId,
            CourtId = courtId
        };
    }
}

