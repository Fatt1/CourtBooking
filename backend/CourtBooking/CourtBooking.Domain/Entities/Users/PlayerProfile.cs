using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Hồ sơ người chơi - 1-1 với ApplicationUser.
/// PK = UserId (Guid) - không có Id riêng.
/// </summary>
public class PlayerProfile : EntityBase<Guid>, IAuditable
{
    public PlayerProfile() { }

    public Guid? AvatarImageId { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public Images.Image? AvatarImage { get; set; }
}
