using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Chi tiết item trong đơn bán lẻ.
/// </summary>
public class RetailOrderItem : EntityBase<Guid>
{
    public RetailOrderItem() { }

    public Guid RetailOrderId { get; set; }
    public Guid ServiceId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    // Navigation
    public RetailOrder RetailOrder { get; set; } = null!;
    public Service Service { get; set; } = null!;
}
