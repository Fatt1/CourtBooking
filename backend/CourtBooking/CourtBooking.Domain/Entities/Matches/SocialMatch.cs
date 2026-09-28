using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Matches;

/// <summary>
/// Kèo giao lưu thể thao - Aggregate Root.
/// Chủ kèo tạo thông qua Order (OrderType = SocialMatch).
/// </summary>
public class SocialMatch : AggregateRoot<Guid>
{
    private SocialMatch() { } // EF Core

    private readonly List<MatchParticipant> _participants = [];

    public Guid OrderId { get; private set; }
    public Guid BranchId { get; private set; }
    public Guid SportTypeId { get; private set; }
    public DateOnly Date { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }

    /// <summary>UserId của người tạo kèo (Player hoặc CourtOwner)</summary>
    public Guid HostId { get; private set; }

    public string? SkillLevel { get; private set; }
    public int MissingPlayers { get; private set; }
    public decimal FeePerPlayer { get; private set; }

    /// <summary>0 = Tự động duyệt, 1 = Chủ kèo duyệt tay</summary>
    public byte ApprovalMode { get; private set; }

    public SocialMatchStatus Status { get; private set; }
    public string? Description { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public IReadOnlyList<MatchParticipant> Participants => _participants.AsReadOnly();

    // --- Factory ---
    public static SocialMatch Create(
        Guid orderId,
        Guid branchId,
        Guid sportTypeId,
        Guid hostId,
        DateOnly date,
        TimeOnly startTime,
        TimeOnly endTime,
        int missingPlayers,
        decimal feePerPlayer,
        byte approvalMode,
        string? skillLevel = null,
        string? description = null)
    {
        return new SocialMatch
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            BranchId = branchId,
            SportTypeId = sportTypeId,
            HostId = hostId,
            Date = date,
            StartTime = startTime,
            EndTime = endTime,
            MissingPlayers = missingPlayers,
            FeePerPlayer = feePerPlayer,
            ApprovalMode = approvalMode,
            SkillLevel = skillLevel,
            Description = description,
            Status = SocialMatchStatus.Open,
            CreatedAt = DateTime.UtcNow
        };
    }

    // --- Domain Methods ---
    public void AddParticipant(Guid playerId) { }
    public void ApproveParticipant(Guid participantId) { }
    public void RejectParticipant(Guid participantId, string reason) { }
    public void ConfirmParticipantPayment(Guid participantId) { }
    public void CancelParticipant(Guid participantId) { }
    public void Close() { }
    public void Cancel() { }
    public void MarkFull() { }

    private void RecalculateMissingSlots() { }
}
