using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Danh mục dịch vụ (VD: Đồ ăn, Nước uống, Dụng cụ thể thao).
/// </summary>
public class ServiceCategory : EntityBase<Guid>, IAuditable
{
    public ServiceCategory() { }

    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public List<Service> Services { get; set; } = [];
}
