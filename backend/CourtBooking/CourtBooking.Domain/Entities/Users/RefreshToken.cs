using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Refresh token cho JWT authentication.
/// </summary>
public class RefreshToken : EntityBase<Guid>
{
    private RefreshToken() { } // EF Core

    public Guid UserId { get; private set; }
    public string Token { get; private set; } = null!;
    public DateTime ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public ApplicationUser User { get; private set; } = null!;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsActive => !IsRevoked && !IsExpired;

    // --- Factory ---
    public static RefreshToken Create(Guid userId, string token, DateTime expiresAt)
    {
        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = token,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };
    }

    // --- Domain Methods ---
    public void Revoke() { }
}
