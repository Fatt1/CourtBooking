using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Matches;

/// <summary>
/// Người tham gia kèo giao lưu.
/// </summary>
public class MatchParticipant : EntityBase<Guid>
{
    public MatchParticipant() { }

    public Guid MatchId { get; set; }
    public Guid PlayerId { get; set; }
    public ParticipantStatus Status { get; set; }

    /// <summary>Hạn thanh toán để giữ chỗ, quá hạn tự huỷ và nhả chỗ</summary>
    public DateTime? HoldExpiresAt { get; set; }

    public DateTime JoinedAt { get; set; }

    // Navigation
    public SocialMatch Match { get; set; } = null!;
    public Users.ApplicationUser Player { get; set; } = null!;
}
