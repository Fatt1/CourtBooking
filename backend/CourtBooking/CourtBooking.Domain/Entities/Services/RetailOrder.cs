using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Đơn bán lẻ dịch vụ tại quầy (không gắn với Order đặt sân).
/// Aggregate Root.
/// </summary>
public class RetailOrder : AggregateRoot<Guid>, IAuditable
{
    private RetailOrder() { } // EF Core

    private readonly List<RetailOrderItem> _items = [];

    public Guid BranchId { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public DateOnly OrderDate { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<RetailOrderItem> Items => _items.AsReadOnly();

    // --- Factory ---
    public static RetailOrder Create(Guid branchId, DateOnly orderDate)
    {
        return new RetailOrder
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            OrderDate = orderDate,
            TotalAmount = 0,
            DiscountAmount = 0
        };
    }

    // --- Domain Methods ---
    public void AddItem(Guid serviceId, int quantity, decimal unitPrice) { }
    public void RemoveItem(Guid itemId) { }
    public void ApplyDiscount(decimal discountAmount) { }
    public void Finalize() { }

    private void RecalculateTotal() { }
}
