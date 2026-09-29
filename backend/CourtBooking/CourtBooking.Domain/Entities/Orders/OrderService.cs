using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Dịch vụ bổ sung trong một đơn đặt sân.
/// </summary>
public class OrderService : EntityBase<Guid>
{
    public OrderService() { }

    public Guid OrderId { get; set; }
    public Guid ServiceId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    // Navigation
    public Order Order { get; set; } = null!;
    public Services.Service Service { get; set; } = null!;
}
