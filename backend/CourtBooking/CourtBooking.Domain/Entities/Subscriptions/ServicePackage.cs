using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Subscriptions;

/// <summary>
/// Gói dịch vụ cho chủ sân (subscription packages).
/// </summary>
public class ServicePackage : EntityBase<Guid>, IAuditable
{
    public ServicePackage() { }

    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string Description { get; set; } = null!;
    public short DurationMonths { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public List<CourtOwnerSubscription> Subscriptions { get; set; } = [];
}
