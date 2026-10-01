using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Đơn bán lẻ dịch vụ tại quầy (không gắn với Order đặt sân).
/// </summary>
public class RetailOrder : EntityBase<Guid>, IAuditable
{
    public RetailOrder() { }

    public Guid BranchId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public DateOnly OrderDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Courts.Branch Branch { get; set; } = null!;
    public List<RetailOrderItem> Items { get; set; } = [];

    public static RetailOrder Create(
        Guid branchId,
        decimal discountAmount,
        DateTime createdAt)
    {
        return new RetailOrder
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            DiscountAmount = discountAmount,
            OrderDate = DateOnly.FromDateTime(createdAt),
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        };
    }

    public void AddItem(Guid serviceId, int quantity, decimal unitPrice)
    {
        Items.Add(new RetailOrderItem
        {
            Id = Guid.NewGuid(),
            RetailOrderId = Id,
            ServiceId = serviceId,
            Quantity = quantity,
            UnitPrice = unitPrice
        });

        TotalAmount = Items.Sum(item => item.Quantity * item.UnitPrice) - DiscountAmount;
    }
}
