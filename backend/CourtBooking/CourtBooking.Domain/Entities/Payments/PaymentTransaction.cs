using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Payments;

/// <summary>
/// Giao dịch thanh toán.
/// Aggregate Root - gắn với Order (nullable nếu là giao dịch tham gia kèo).
/// </summary>
public class PaymentTransaction : AggregateRoot<Guid>
{
    private PaymentTransaction() { } // EF Core

    /// <summary>Null nếu là giao dịch tham gia kèo (MatchParticipant)</summary>
    public Guid? OrderId { get; private set; }

    public decimal Amount { get; private set; }
    public PaymentTransactionType Type { get; private set; }
    public PaymentMethod Method { get; private set; }
    public Guid? ProofImageId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // --- Factory ---
    public static PaymentTransaction Create(
        decimal amount,
        PaymentTransactionType type,
        PaymentMethod method,
        Guid? orderId = null,
        Guid? proofImageId = null)
    {
        return new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            Amount = amount,
            Type = type,
            Method = method,
            OrderId = orderId,
            ProofImageId = proofImageId,
            CreatedAt = DateTime.UtcNow
        };
    }

    // --- Domain Methods ---
    public void UploadProof(Guid proofImageId) { }
}
