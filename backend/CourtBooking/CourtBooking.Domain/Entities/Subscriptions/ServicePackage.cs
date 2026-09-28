using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Subscriptions;

/// <summary>
/// Gói dịch vụ cho chủ sân (subscription packages).
/// Aggregate Root.
/// </summary>
public class ServicePackage : AggregateRoot<Guid>, IAuditable
{
    private ServicePackage() { } // EF Core

    public string Name { get; private set; } = null!;
    public decimal Price { get; private set; }
    public string Description { get; private set; } = null!;
    public short DurationMonths { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // --- Factory ---
    public static ServicePackage Create(string name, decimal price, string description, short durationMonths)
    {
        return new ServicePackage
        {
            Id = Guid.NewGuid(),
            Name = name,
            Price = price,
            Description = description,
            DurationMonths = durationMonths
        };
    }

    // --- Domain Methods ---
    public void UpdateInfo(string name, string description, decimal price, short durationMonths) { }
}
