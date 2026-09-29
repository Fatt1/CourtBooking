using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Events;

/// <summary>
/// Sự kiện thể thao do chủ sân tổ chức.
/// </summary>
public class SportEvent : EntityBase<Guid>
{
    public SportEvent() { }

    public Guid OrderId { get; set; }
    public Guid SportTypeId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Title { get; set; } = null!;
    public string? SkillLevelFrom { get; set; }
    public string? SkillLevelTo { get; set; }
    public decimal TicketPrice { get; set; }
    public int Slots { get; set; }
    public int AvailableSlot { get; set; }
    public EventStatus Status { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Orders.Order Order { get; set; } = null!;
    public Courts.SportType SportType { get; set; } = null!;

    public List<EventTicket> Tickets { get; set; } = [];
}
