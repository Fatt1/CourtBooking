using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Bảng giá áp dụng cho một CourtType
/// </summary>
public class PriceTable : EntityBase<Guid>, IAuditable
{
    public PriceTable() { }

    public Guid CourtTypeId { get; set; }
    public string Name { get; set; } = null!;
    public bool IsActive { get; set; }
    public decimal DefaultPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public CourtType CourtType { get; set; } = null!;
    public List<PriceTableRule> Rules { get; set; } = [];
}
