using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Đơn bán lẻ dịch vụ tại quầy (không gắn với Order đặt sân).
/// </summary>
public class RetailOrder : EntityBase<Guid>, IAuditable
{
    public RetailOrder() { }

    public Guid BranchId { get; set; }
    public string OrderCode { get; set; } = null!;
    public Guid CreatedByUserId { get; set; }
    public string? CustomerName { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
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
        Guid createdByUserId,
        string? customerName,
        PaymentMethod paymentMethod,
        decimal discountAmount,
        DateTime createdAt)
    {
        return new RetailOrder
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            CreatedByUserId = createdByUserId,
            CustomerName = string.IsNullOrWhiteSpace(customerName) ? null : customerName.Trim(),
            PaymentMethod = paymentMethod,
            DiscountAmount = discountAmount,
            OrderCode = $"POS-{createdAt:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
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
