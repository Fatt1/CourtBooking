using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Chi tiết một buổi đặt sân trong Order.
/// Child entity của Order aggregate.
/// </summary>
public class OrderDetail : EntityBase<Guid>
{
    private OrderDetail() { } // EF Core

    public Guid OrderId { get; private set; }
    public Guid CourtId { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public decimal Price { get; private set; }
    public DateOnly Date { get; private set; }

    // Navigation
    public Order Order { get; private set; } = null!;

    internal static OrderDetail Create(
        Guid orderId,
        Guid courtId,
        TimeOnly startTime,
        TimeOnly endTime,
        DateOnly date,
        decimal price)
    {
        return new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            CourtId = courtId,
            StartTime = startTime,
            EndTime = endTime,
            Date = date,
            Price = price
        };
    }
}
