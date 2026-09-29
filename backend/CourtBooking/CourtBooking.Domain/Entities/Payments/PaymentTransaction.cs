using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Payments;

/// <summary>
/// Giao dịch thanh toán.
/// </summary>
public class PaymentTransaction : EntityBase<Guid>
{
    public PaymentTransaction() { }

    /// <summary>Null nếu là giao dịch tham gia kèo (MatchParticipant)</summary>
    public Guid? OrderId { get; set; }

    public decimal Amount { get; set; }
    public PaymentTransactionType Type { get; set; }
    public PaymentMethod Method { get; set; }
    public Guid? ProofImageId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Orders.Order? Order { get; set; }
    public Images.Image? ProofImage { get; set; }
}
