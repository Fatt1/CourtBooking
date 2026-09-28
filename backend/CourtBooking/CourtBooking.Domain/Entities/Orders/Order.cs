using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Đơn đặt sân - Aggregate Root.
/// Bao gồm: chi tiết buổi đặt (OrderDetail), dịch vụ đi kèm (OrderService).
/// </summary>
public class Order : AggregateRoot<Guid>, IAuditable
{
    private Order() { } // EF Core

    private readonly List<OrderDetail> _details = [];
    private readonly List<OrderService> _services = [];
    private readonly List<FixedOrderConfig> _fixedConfigs = [];

    public string OrderCode { get; private set; } = null!;
    public Guid BranchId { get; private set; }
    public Guid? PlayerId { get; private set; }
    public string CustomerName { get; private set; } = null!;
    public string CustomerPhone { get; private set; } = null!;
    public OrderChannel Channel { get; private set; }
    public decimal TotalCourtAmount { get; private set; }
    public decimal TotalServiceAmount { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTime HoldExpiresAt { get; private set; }
    public DateOnly OrderDate { get; private set; }
    public OrderType OrderType { get; private set; }
    public string? CancelReason { get; private set; }
    public string? Note { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<OrderDetail> Details => _details.AsReadOnly();
    public IReadOnlyList<OrderService> Services => _services.AsReadOnly();
    public IReadOnlyList<FixedOrderConfig> FixedConfigs => _fixedConfigs.AsReadOnly();

    // --- Computed Total Amount ---
    public decimal GetTotalAmount() => TotalCourtAmount + TotalServiceAmount - DiscountAmount;

    // --- Factory ---
    public static Order Create(
        string orderCode,
        Guid branchId,
        string customerName,
        string customerPhone,
        OrderChannel channel,
        OrderType orderType,
        DateOnly orderDate,
        DateTime holdExpiresAt,
        Guid? playerId = null)
    {
        return new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = orderCode,
            BranchId = branchId,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            Channel = channel,
            OrderType = orderType,
            OrderDate = orderDate,
            HoldExpiresAt = holdExpiresAt,
            PlayerId = playerId,
            Status = OrderStatus.Pending,
            TotalCourtAmount = 0,
            TotalServiceAmount = 0,
            DiscountAmount = 0
        };
    }

    // --- Domain Methods ---
    public void AddDetail(Guid courtId, TimeOnly startTime, TimeOnly endTime, DateOnly date, decimal price) { }
    public void RemoveDetail(Guid detailId) { }
    public void AddService(Guid serviceId, int quantity, decimal unitPrice) { }
    public void RemoveService(Guid serviceId) { }
    public void ApplyDiscount(decimal discountAmount) { }
    public void Confirm() { }
    public void Cancel(string reason) { }
    public void Complete() { }
    public void UpdateNote(string note) { }

    // --- Fixed Order Config Methods ---
    public void AddFixedConfig(
        DateOnly startDate,
        DateOnly endDate,
        int daysOfWeekMask,
        TimeOnly startTime,
        TimeOnly endTime,
        IEnumerable<Guid> courtIds,
        string? exceptionDates = null) { }

    public void RemoveFixedConfig(Guid configId) { }

    private void RecalculateTotals() { }
}
