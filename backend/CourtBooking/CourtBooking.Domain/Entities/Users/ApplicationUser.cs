using CourtBooking.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Tài khoản người dùng - kế thừa ASP.NET Identity.
/// Thay thế bảng Users + Roles + UserRoles trong DB.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    private ApplicationUser() { } // EF Core

    public string FullName { get; private set; } = null!;
    public UserStatus Status { get; private set; }
    public AccountType AccountType { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation properties
    public PlayerProfile? PlayerProfile { get; private set; }
    public CourtOwner? CourtOwner { get; private set; }
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();
    private readonly List<RefreshToken> _refreshTokens = [];

    // --- Factory ---
    public static ApplicationUser Create(string fullName, string email, string phoneNumber, AccountType accountType)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Email = email,
            UserName = email,
            PhoneNumber = phoneNumber,
            AccountType = accountType,
            Status = UserStatus.Active,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        return user;
    }

    // --- Domain Methods ---
    public void UpdateProfile(string fullName, string? phoneNumber) { }
    public void Activate() { }
    public void Deactivate() { }
    public void Ban() { }
    public void SoftDelete() { }
    public void Restore() { }
}
