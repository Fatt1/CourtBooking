using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Orders;

/// <summary>
/// Chi tiết một buổi đặt sân trong Order.
/// </summary>
public class OrderDetail : EntityBase<Guid>
{
    public OrderDetail() { }

    public Guid OrderId { get; set; }
    public Guid CourtId { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal Price { get; set; }
    public DateOnly Date { get; set; }

    // Navigation
    public Order Order { get; set; } = null!;
    public Courts.Court Court { get; set; } = null!;
}
