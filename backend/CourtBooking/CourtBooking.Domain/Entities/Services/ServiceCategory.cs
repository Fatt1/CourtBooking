using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Danh mục dịch vụ (VD: Đồ ăn, Nước uống, Dụng cụ thể thao).
/// Aggregate Root.
/// </summary>
public class ServiceCategory : AggregateRoot<Guid>, IAuditable
{
    private ServiceCategory() { } // EF Core

    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // --- Factory ---
    public static ServiceCategory Create(string name, string? description = null, int displayOrder = 0)
    {
        return new ServiceCategory
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            IsActive = true
        };
    }

    // --- Domain Methods ---
    public void UpdateInfo(string name, string? description) { }
    public void Activate() { }
    public void Deactivate() { }
}
