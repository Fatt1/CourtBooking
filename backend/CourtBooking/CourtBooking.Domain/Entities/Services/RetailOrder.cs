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
}
