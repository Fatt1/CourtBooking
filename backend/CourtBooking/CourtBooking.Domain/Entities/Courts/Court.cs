using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Sân thể thao cụ thể (VD: Sân 1, Sân 2, Sân VIP)
/// </summary>
public class Court : EntityBase<Guid>, IAuditable
{
    public Court() { }

    public Guid CourtTypeId { get; set; }
    public string Name { get; set; } = null!;
    public CourtStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public CourtType CourtType { get; set; } = null!;
    public List<Orders.OrderDetail> OrderDetails { get; set; } = [];
    public List<FixedTimeBlockCourt> FixedTimeBlockCourts { get; set; } = [];
    public List<Orders.FixedOrderConfigCourt> FixedOrderConfigCourts { get; set; } = [];
}
