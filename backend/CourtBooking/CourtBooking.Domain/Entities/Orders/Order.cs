using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Đơn đặt sân.
/// </summary>
public class Order : EntityBase<Guid>, IAuditable
{
    public Order() { }

    public string OrderCode { get; set; } = null!;
    public Guid BranchId { get; set; }
    public Guid? PlayerId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string CustomerPhone { get; set; } = null!;
    public OrderChannel Channel { get; set; }
    public decimal TotalCourtAmount { get; set; }
    public decimal TotalServiceAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime HoldExpiresAt { get; set; }
    public DateOnly OrderDate { get; set; }
    public OrderType OrderType { get; set; }
    public string? CancelReason { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Courts.Branch Branch { get; set; } = null!;
    public Users.ApplicationUser? Player { get; set; }
    public Events.SportEvent? SportEvent { get; set; }
    public Matches.SocialMatch? SocialMatch { get; set; }

    public List<Payments.PaymentTransaction> PaymentTransactions { get; set; } = [];
    public List<Reviews.Review> Reviews { get; set; } = [];
    public List<OrderDetail> Details { get; set; } = [];
    public List<OrderService> Services { get; set; } = [];
    public List<FixedOrderConfig> FixedConfigs { get; set; } = [];

    public decimal TotalAmount => TotalCourtAmount + TotalServiceAmount - DiscountAmount;
}
