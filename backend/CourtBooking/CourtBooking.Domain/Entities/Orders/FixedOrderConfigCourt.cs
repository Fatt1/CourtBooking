namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Bảng liên kết giữa cấu hình đặt cố định và sân áp dụng (Composite Key: FixedOrderConfigId, CourtId).
/// </summary>
public class FixedOrderConfigCourt
{
    public FixedOrderConfigCourt() { }

    public Guid FixedOrderConfigId { get; set; }
    public Guid CourtId { get; set; }

    // Navigation
    public FixedOrderConfig FixedOrderConfig { get; set; } = null!;
    public Courts.Court Court { get; set; } = null!;
}
