using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Events;

/// <summary>
/// Vé tham gia sự kiện.
/// Child entity của SportEvent aggregate.
/// </summary>
public class EventTicket : EntityBase<Guid>
{
    private EventTicket() { } // EF Core

    public Guid EventId { get; private set; }
    public Guid PlayerId { get; private set; }
    public int Quantity { get; private set; }
    public PaymentMethod PaymentMethod { get; private set; }
    public Guid? ProofImageId { get; private set; }
    public EventTicketStatus Status { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public string? RefundNote { get; private set; }
    public decimal Price { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public SportEvent Event { get; private set; } = null!;

    internal static EventTicket Create(Guid eventId, Guid playerId, int quantity, PaymentMethod paymentMethod, decimal price)
    {
        return new EventTicket
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            PlayerId = playerId,
            Quantity = quantity,
            PaymentMethod = paymentMethod,
            Price = price,
            Status = EventTicketStatus.PendingApproval,
            CreatedAt = DateTime.UtcNow
        };
    }

    // --- Domain Methods (called via SportEvent aggregate) ---
    internal void UploadProof(Guid proofImageId) { }
    internal void Approve() { }
    internal void Refund(string refundNote) { }
    internal void Cancel() { }
}
