using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Bảng giá áp dụng cho một CourtType - Aggregate Root độc lập.
/// Quản lý các quy tắc tính giá (PriceTableRule) theo khung giờ, ngày trong tuần.
/// Tham chiếu CourtType qua CourtTypeId (Guid).
/// </summary>
public class PriceTable : AggregateRoot<Guid>, IAuditable
{
    private PriceTable() { } // EF Core

    private readonly List<PriceTableRule> _rules = [];

    public Guid CourtTypeId { get; private set; }
    public string Name { get; private set; } = null!;
    public bool IsActive { get; private set; }
    public decimal DefaultPrice { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<PriceTableRule> Rules => _rules.AsReadOnly();

    // --- Factory ---
    public static PriceTable Create(Guid courtTypeId, string name, decimal defaultPrice)
    {
        return new PriceTable
        {
            Id = Guid.NewGuid(),
            CourtTypeId = courtTypeId,
            Name = name,
            DefaultPrice = defaultPrice,
            IsActive = true
        };
    }

    // --- Domain Methods ---
    public void Activate() { }
    public void Deactivate() { }
    public void UpdateDefaultPrice(decimal price) { }
    public void AddRule(
        DayOfWeek dayOfWeekFrom, DayOfWeek dayOfWeekTo,
        TimeOnly startTime, TimeOnly endTime,
        decimal fixedCustomerPrice, decimal walkInCustomerPrice) { }
    public void RemoveRule(Guid ruleId) { }
}

