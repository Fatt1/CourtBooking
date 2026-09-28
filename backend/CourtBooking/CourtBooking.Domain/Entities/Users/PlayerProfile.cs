using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Hồ sơ người chơi - 1-1 với ApplicationUser.
/// PK = UserId (Guid) - không có Id riêng.
/// </summary>
public class PlayerProfile : EntityBase<Guid>, IAuditable
{
    private PlayerProfile() { } // EF Core

    public Guid? AvatarImageId { get; private set; }
    public DateOnly? DateOfBirth { get; private set; }
    public Gender Gender { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ApplicationUser User { get; private set; } = null!;

    // --- Factory ---
    public static PlayerProfile Create(Guid userId, Gender gender, DateOnly? dateOfBirth = null, Guid? avatarImageId = null)
    {
        return new PlayerProfile
        {
            Id = userId,
            Gender = gender,
            DateOfBirth = dateOfBirth,
            AvatarImageId = avatarImageId
        };
    }

    // --- Domain Methods ---
    public void UpdateAvatar(Guid? avatarImageId) { }
    public void UpdateDateOfBirth(DateOnly dateOfBirth) { }
    public void UpdateGender(Gender gender) { }
}
