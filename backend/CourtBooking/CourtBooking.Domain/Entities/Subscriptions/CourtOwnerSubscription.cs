using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Subscriptions;

/// <summary>
/// Đăng ký gói dịch vụ của chủ sân.
/// Aggregate Root.
/// </summary>
public class CourtOwnerSubscription : AggregateRoot<Guid>
{
    private CourtOwnerSubscription() { } // EF Core

    public Guid CourtOwnerId { get; private set; }
    public Guid ServicePackageId { get; private set; }
    public decimal PricePaid { get; private set; }
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public bool IsActive => DateOnly.FromDateTime(DateTime.UtcNow) >= StartDate
                         && DateOnly.FromDateTime(DateTime.UtcNow) <= EndDate;

    // --- Factory ---
    public static CourtOwnerSubscription Create(
        Guid courtOwnerId,
        Guid servicePackageId,
        decimal pricePaid,
        DateOnly startDate,
        DateOnly endDate)
    {
        return new CourtOwnerSubscription
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = courtOwnerId,
            ServicePackageId = servicePackageId,
            PricePaid = pricePaid,
            StartDate = startDate,
            EndDate = endDate,
            CreatedAt = DateTime.UtcNow
        };
    }
}
