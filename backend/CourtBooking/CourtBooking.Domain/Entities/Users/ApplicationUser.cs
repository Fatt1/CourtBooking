using CourtBooking.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Tài khoản người dùng - kế thừa ASP.NET Identity.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    public ApplicationUser() { }

    public string FullName { get; set; } = null!;
    public UserStatus Status { get; set; }
    public AccountType AccountType { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public PlayerProfile? PlayerProfile { get; set; }
    public CourtOwner? CourtOwner { get; set; }
    public List<RefreshToken> RefreshTokens { get; set; } = [];
    public List<Orders.Order> Orders { get; set; } = [];
    public List<Reviews.Review> Reviews { get; set; } = [];
    public List<Events.EventTicket> EventTickets { get; set; } = [];
    public List<Matches.MatchParticipant> MatchParticipants { get; set; } = [];
}
