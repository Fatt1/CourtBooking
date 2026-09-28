using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Hồ sơ chủ sân - 1-1 với ApplicationUser.
/// PK = UserId (Guid).
/// </summary>
public class CourtOwner : EntityBase<Guid>, IAuditable
{
    private CourtOwner() { } // EF Core

    public string BusinessName { get; private set; } = null!;
    public string? TaxCode { get; private set; }
    public bool MustChangePwd { get; private set; }
    public Guid QrImageId { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ApplicationUser User { get; private set; } = null!;

    // --- Factory ---
    public static CourtOwner Create(Guid userId, string businessName, Guid qrImageId, string? taxCode = null)
    {
        return new CourtOwner
        {
            Id = userId,
            BusinessName = businessName,
            QrImageId = qrImageId,
            TaxCode = taxCode,
            MustChangePwd = true
        };
    }

    // --- Domain Methods ---
    public void UpdateBusinessInfo(string businessName, string? taxCode) { }
    public void UpdateQrImage(Guid qrImageId) { }
    public void MarkPasswordChanged() { }
}
