using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Chi tiết item trong đơn bán lẻ.
/// Child entity của RetailOrder aggregate.
/// </summary>
public class RetailOrderItem : EntityBase<Guid>
{
    private RetailOrderItem() { } // EF Core

    public Guid RetailOrderId { get; private set; }
    public Guid ServiceId { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }

    // Navigation
    public RetailOrder RetailOrder { get; private set; } = null!;

    internal static RetailOrderItem Create(Guid retailOrderId, Guid serviceId, int quantity, decimal unitPrice)
    {
        return new RetailOrderItem
        {
            Id = Guid.NewGuid(),
            RetailOrderId = retailOrderId,
            ServiceId = serviceId,
            Quantity = quantity,
            UnitPrice = unitPrice
        };
    }

    internal void UpdateQuantity(int quantity) { }
}
