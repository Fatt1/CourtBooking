using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Matches;

/// <summary>
/// Người tham gia kèo giao lưu.
/// Child entity của SocialMatch aggregate.
/// </summary>
public class MatchParticipant : EntityBase<Guid>
{
    private MatchParticipant() { } // EF Core

    public Guid MatchId { get; private set; }
    public Guid PlayerId { get; private set; }
    public ParticipantStatus Status { get; private set; }

    /// <summary>Hạn thanh toán để giữ chỗ, quá hạn tự huỷ và nhả chỗ</summary>
    public DateTime? HoldExpiresAt { get; private set; }

    public DateTime JoinedAt { get; private set; }

    // Navigation
    public SocialMatch Match { get; private set; } = null!;

    internal static MatchParticipant Create(Guid matchId, Guid playerId)
    {
        return new MatchParticipant
        {
            Id = Guid.NewGuid(),
            MatchId = matchId,
            PlayerId = playerId,
            Status = ParticipantStatus.PendingApproval,
            JoinedAt = DateTime.UtcNow
        };
    }

    // --- Domain Methods (called via SocialMatch aggregate) ---
    internal void Approve(DateTime holdExpiresAt) { }
    internal void Reject() { }
    internal void ConfirmPayment() { }
    internal void Cancel() { }
    internal void Expire() { }
}
