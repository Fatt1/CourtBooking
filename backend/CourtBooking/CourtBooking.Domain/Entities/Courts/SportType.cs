using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Loại hình thể thao (Cầu lông, Pickleball, v.v.)
/// </summary>
public class SportType : AggregateRoot<Guid>
{
    private SportType() { } // EF Core

    public string Name { get; private set; } = null!;
    public Guid? ImageId { get; private set; }
    public bool IsActive { get; private set; }

    // --- Factory ---
    public static SportType Create(string name, Guid? imageId = null)
    {
        return new SportType
        {
            Id = Guid.NewGuid(),
            Name = name,
            ImageId = imageId,
            IsActive = true
        };
    }

    // --- Domain Methods ---
    public void UpdateInfo(string name, Guid? imageId) { }
    public void Activate() { }
    public void Deactivate() { }
}
