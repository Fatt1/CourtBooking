using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Sân thể thao cụ thể (VD: Sân 1, Sân 2, Sân VIP) - Aggregate Root độc lập.
/// Quản lý thông tin và trạng thái hoạt động của từng sân.
/// Tham chiếu CourtType qua CourtTypeId (Guid).
/// </summary>
public class Court : AggregateRoot<Guid>, IAuditable
{
    private Court() { } // EF Core

    public Guid CourtTypeId { get; private set; }
    public string Name { get; private set; } = null!;
    public CourtStatus Status { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // --- Factory ---
    public static Court Create(Guid courtTypeId, string name)
    {
        return new Court
        {
            Id = Guid.NewGuid(),
            CourtTypeId = courtTypeId,
            Name = name,
            Status = CourtStatus.Available
        };
    }

    // --- Domain Methods ---
    public void Rename(string name) { }
    public void SetMaintenance() { }
    public void SetAvailable() { }
    public void Deactivate() { }
}

