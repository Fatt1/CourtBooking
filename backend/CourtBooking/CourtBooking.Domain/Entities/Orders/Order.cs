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


    public static Order CreateOrderOnline(
        Guid branchId,
        Guid? playerId,
        string customerName,
        string customerPhone,
        string? note
       )
    {
        string orderCode = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid().ToString().Substring(0, 8)}";
        var orderDate = DateOnly.FromDateTime(DateTime.UtcNow);
        return new Order
        {
            Id = Guid.CreateVersion7(),
            OrderCode = orderCode,
            BranchId = branchId,
            PlayerId = playerId,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            Channel = OrderChannel.Online,
            TotalCourtAmount = 0,
            TotalServiceAmount = 0,
            DiscountAmount = 0,
            Status = OrderStatus.AwaitingPayment, // Mặc định là PendingPayment cho đơn đặt sân online
            HoldExpiresAt = GetHoldExpiresAt(),
            OrderDate = orderDate,
            OrderType = OrderType.Normal,
            Note = note

        };
    }


    public static Order CreateOrderByOwner(
        Guid branchId,
        Guid? playerId,
        string customerName,
        string customerPhone,
        string? note,
        decimal discountAmount = 0)
    {
        string orderCode = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid().ToString().Substring(0, 8)}";
        var orderDate = DateOnly.FromDateTime(DateTime.UtcNow);
        return new Order
        {
            Id = Guid.CreateVersion7(),
            OrderCode = orderCode,
            BranchId = branchId,
            PlayerId = playerId,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            Channel = OrderChannel.Pos,
            TotalCourtAmount = 0,
            TotalServiceAmount = 0,
            DiscountAmount = discountAmount,
            Status = OrderStatus.Confirmed,
            HoldExpiresAt = DateTime.UtcNow.AddYears(100),
            OrderDate = orderDate,
            OrderType = OrderType.Normal,
            Note = note
        };
    }

    public void ConfirmOrder()
    {
        Status = OrderStatus.Confirmed;
    }

    public void CancelOrder(string cancelReason)
    {
        Status = OrderStatus.Cancelled;
        CancelReason = cancelReason;
    }

    public decimal CalculateRemainingAmount()
    {
        return TotalAmount - PaymentTransactions.Sum(t => t.Amount);
    }

    public void AddOrderDetail(Guid CourtId,
       TimeOnly StartTime,
       TimeOnly EndTime,
       decimal Price,
       DateOnly Date)
    {
        var oderDetail = new OrderDetail
        {
            Id = Guid.CreateVersion7(),
            OrderId = Id,
            CourtId = CourtId,
            StartTime = StartTime,
            EndTime = EndTime,
            Price = Price,
            Date = Date
        };
        Details.Add(oderDetail);
        TotalCourtAmount += Price;
    }

    public void AddOrderService(Guid ServiceId, decimal Price, int Quantity)
    {
        var orderService = new OrderService
        {
            Id = Guid.CreateVersion7(),
            OrderId = Id,
            ServiceId = ServiceId,
            UnitPrice = Price,
            Quantity = Quantity
        };
        Services.Add(orderService);
        TotalServiceAmount += Price * Quantity;
    }

    public void RemoveOrderService(Guid orderServiceId)
    {
        var orderService = Services.FirstOrDefault(s => s.Id == orderServiceId);
        if (orderService != null)
        {
            TotalServiceAmount -= orderService.UnitPrice * orderService.Quantity;
            Services.Remove(orderService);
        }
    }

    public void RemoveOrderDetail(Guid orderDetailId)
    {
        var orderDetail = Details.FirstOrDefault(d => d.Id == orderDetailId);
        if (orderDetail != null)
        {
            TotalCourtAmount -= orderDetail.Price;
            Details.Remove(orderDetail);
        }
    }

    public void ApplyDiscount(decimal discountAmount)
    {

        DiscountAmount = discountAmount;
    }

    private static DateTime GetHoldExpiresAt()
    {
        // Giả sử thời gian giữ chỗ là 10 phút kể từ thời điểm tạo đơn
        return DateTime.UtcNow.AddMinutes(10);
    }
}
