using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Dịch vụ bổ sung (VD: Nước suối, Vợt cầu lông).
/// </summary>
public class Service : EntityBase<Guid>, IAuditable
{
    public Service() { }

    public Guid CategoryId { get; set; }
    public string Name { get; set; } = null!;
    public string Unit { get; set; } = null!;
    public Guid? ImageId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ServiceCategory Category { get; set; } = null!;
    public Images.Image? Image { get; set; }
    public List<ServiceBranch> Branches { get; set; } = [];
}
