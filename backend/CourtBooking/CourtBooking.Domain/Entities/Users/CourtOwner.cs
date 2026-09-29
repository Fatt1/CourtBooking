using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Hồ sơ chủ sân - 1-1 với ApplicationUser.
/// PK = UserId (Guid).
/// </summary>
public class CourtOwner : EntityBase<Guid>, IAuditable
{
    public CourtOwner() { }

    public string BusinessName { get; set; } = null!;
    public string? TaxCode { get; set; }
    public bool MustChangePwd { get; set; }
    public Guid QrImageId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public Images.Image QrImage { get; set; } = null!;

    public List<Courts.Branch> Branches { get; set; } = [];
    public List<Subscriptions.CourtOwnerSubscription> Subscriptions { get; set; } = [];
}
