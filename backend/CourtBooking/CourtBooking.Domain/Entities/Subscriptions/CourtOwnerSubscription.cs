using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Subscriptions;

/// <summary>
/// Đăng ký gói dịch vụ của chủ sân.
/// </summary>
public class CourtOwnerSubscription : EntityBase<Guid>
{
    public CourtOwnerSubscription() { }

    public Guid CourtOwnerId { get; set; }
    public Guid ServicePackageId { get; set; }
    public decimal PricePaid { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Users.CourtOwner CourtOwner { get; set; } = null!;
    public ServicePackage ServicePackage { get; set; } = null!;

    public bool IsActive => DateOnly.FromDateTime(DateTime.UtcNow) >= StartDate
                         && DateOnly.FromDateTime(DateTime.UtcNow) <= EndDate;
}
