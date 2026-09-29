using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Loại sân trong một chi nhánh (VD: Sân 5 người, Sân 7 người, Sân đơn, Sân đôi)
/// </summary>
public class CourtType : EntityBase<Guid>
{
    public CourtType() { }

    public Guid BranchId { get; set; }
    public string Name { get; set; } = null!;
    public int MinutesConfig { get; set; }

    // Navigation properties
    public Branch Branch { get; set; } = null!;
    public List<Court> Courts { get; set; } = [];
    public List<PriceTable> PriceTables { get; set; } = [];
    public List<FixedTimeBlock> FixedTimeBlocks { get; set; } = [];
}
