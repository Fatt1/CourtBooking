using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Dịch vụ bổ sung trong một đơn đặt sân.
/// Child entity của Order aggregate.
/// </summary>
public class OrderService : EntityBase<Guid>
{
    private OrderService() { } // EF Core

    public Guid OrderId { get; private set; }
    public Guid ServiceId { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }

    // Navigation
    public Order Order { get; private set; } = null!;

    internal static OrderService Create(Guid orderId, Guid serviceId, int quantity, decimal unitPrice)
    {
        return new OrderService
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ServiceId = serviceId,
            Quantity = quantity,
            UnitPrice = unitPrice
        };
    }

    internal void UpdateQuantity(int quantity) { }
}
