using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Refresh token cho JWT authentication.
/// </summary>
public class RefreshToken : EntityBase<Guid>
{
    public RefreshToken() { }

    public Guid UserId { get; set; }
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsActive => !IsRevoked && !IsExpired;
}
