using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Matches;

/// <summary>
/// Kèo giao lưu thể thao.
/// </summary>
public class SocialMatch : EntityBase<Guid>
{
    public SocialMatch() { }

    public Guid OrderId { get; set; }
    public Guid BranchId { get; set; }
    public Guid SportTypeId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    /// <summary>UserId của người tạo kèo (Player hoặc CourtOwner)</summary>
    public Guid HostId { get; set; }

    public string? SkillLevel { get; set; }
    public int MissingPlayers { get; set; }
    public decimal FeePerPlayer { get; set; }

    /// <summary>0 = Tự động duyệt, 1 = Chủ kèo duyệt tay</summary>
    public byte ApprovalMode { get; set; }

    public int AvailableSlots { get; set; }

    public SocialMatchStatus Status { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Orders.Order Order { get; set; } = null!;
    public Courts.Branch Branch { get; set; } = null!;
    public Courts.SportType SportType { get; set; } = null!;
    public Users.ApplicationUser Host { get; set; } = null!;

    public List<MatchParticipant> Participants { get; set; } = [];
}
