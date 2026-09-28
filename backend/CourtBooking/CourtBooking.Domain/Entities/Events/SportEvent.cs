using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Events;

/// <summary>
/// Sự kiện thể thao do chủ sân tổ chức - Aggregate Root.
/// Liên kết với Order (OrderType = Event, Channel = CourtOwnerCreated).
/// </summary>
public class SportEvent : AggregateRoot<Guid>
{
    private SportEvent() { } // EF Core

    private readonly List<EventTicket> _tickets = [];

    public Guid OrderId { get; private set; }
    public Guid SportTypeId { get; private set; }
    public DateOnly Date { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public string Title { get; private set; } = null!;
    public string? SkillLevelFrom { get; private set; }
    public string? SkillLevelTo { get; private set; }
    public decimal TicketPrice { get; private set; }
    public int Slots { get; private set; }
    public int AvailableSlot { get; private set; }
    public EventStatus Status { get; private set; }
    public string? Description { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public IReadOnlyList<EventTicket> Tickets => _tickets.AsReadOnly();

    // --- Factory ---
    public static SportEvent Create(
        Guid orderId,
        Guid sportTypeId,
        DateOnly date,
        TimeOnly startTime,
        TimeOnly endTime,
        string title,
        int slots,
        decimal ticketPrice,
        string? skillLevelFrom = null,
        string? skillLevelTo = null,
        string? description = null)
    {
        return new SportEvent
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            SportTypeId = sportTypeId,
            Date = date,
            StartTime = startTime,
            EndTime = endTime,
            Title = title,
            Slots = slots,
            AvailableSlot = slots,
            TicketPrice = ticketPrice,
            SkillLevelFrom = skillLevelFrom,
            SkillLevelTo = skillLevelTo,
            Description = description,
            Status = EventStatus.Open,
            CreatedAt = DateTime.UtcNow
        };
    }

    // --- Domain Methods ---
    public void BookTicket(Guid playerId, int quantity, PaymentMethod paymentMethod) { }
    public void ApproveTicket(Guid ticketId) { }
    public void RefundTicket(Guid ticketId, string refundNote) { }
    public void CancelTicket(Guid ticketId) { }
    public void Close() { }
    public void Cancel() { }
    public void UpdateInfo(string title, string? description) { }

    private void RecalculateAvailableSlots() { }
}
