using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Loại sân trong một chi nhánh (VD: Sân 5 người, Sân 7 người, Sân đơn, Sân đôi) - Aggregate Root NHỎ.
/// Chỉ quản lý thông tin cấu hình của loại sân.
/// Court, PriceTable, FixedTimeBlock là các Aggregate Root độc lập, tham chiếu CourtType qua CourtTypeId (Guid).
/// </summary>
public class CourtType : AggregateRoot<Guid>
{
    private CourtType() { } // EF Core

    // FK tham chiếu Branch bằng Guid
    public Guid BranchId { get; private set; }
    public string Name { get; private set; } = null!;

    /// <summary>
    /// Đơn vị thời gian của sân (phút), VD: 30, 60, 90
    /// </summary>
    public int MinutesConfig { get; private set; }

    // --- Factory ---
    public static CourtType Create(Guid branchId, string name, int minutesConfig)
    {
        return new CourtType
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            Name = name,
            MinutesConfig = minutesConfig
        };
    }

    // --- Domain Methods ---
    public void UpdateInfo(string name, int minutesConfig) { }
}

