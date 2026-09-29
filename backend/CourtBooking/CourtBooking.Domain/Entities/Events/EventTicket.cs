using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Events;

/// <summary>
/// Vé tham gia sự kiện.
/// </summary>
public class EventTicket : EntityBase<Guid>
{
    public EventTicket() { }

    public Guid EventId { get; set; }
    public Guid PlayerId { get; set; }
    public int Quantity { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public Guid? ProofImageId { get; set; }
    public EventTicketStatus Status { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RefundNote { get; set; }
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public SportEvent Event { get; set; } = null!;
    public Users.ApplicationUser Player { get; set; } = null!;
    public Images.Image? ProofImage { get; set; }
}
