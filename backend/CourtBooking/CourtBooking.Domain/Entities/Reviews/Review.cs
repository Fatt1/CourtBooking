using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Reviews;

/// <summary>
/// Đánh giá chi nhánh sau khi sử dụng sân.
/// Aggregate Root - 1-1 với Order.
/// </summary>
public class Review : AggregateRoot<Guid>
{
    private Review() { } // EF Core

    public Guid BranchId { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid PlayerId { get; private set; }
    public byte Rating { get; private set; }
    public string? Comment { get; private set; }
    public Guid? ImageId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // --- Factory ---
    public static Review Create(
        Guid branchId,
        Guid orderId,
        Guid playerId,
        byte rating,
        string? comment = null,
        Guid? imageId = null)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 1 and 5.");

        return new Review
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            OrderId = orderId,
            PlayerId = playerId,
            Rating = rating,
            Comment = comment,
            ImageId = imageId,
            CreatedAt = DateTime.UtcNow
        };
    }

    // --- Domain Methods ---
    public void UpdateContent(byte rating, string? comment, Guid? imageId) { }
}
