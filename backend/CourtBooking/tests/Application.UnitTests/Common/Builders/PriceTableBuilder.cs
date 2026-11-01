using CourtBooking.Domain.Entities.Courts;

namespace Application.UnitTests.Common.Builders;

public sealed class PriceTableBuilder
{
    private Guid _id = Guid.CreateVersion7();
    private Guid _courtTypeId = Guid.CreateVersion7();
    private string _name = "Bảng giá tiêu chuẩn";
    private bool _isActive = true;
    private decimal _defaultPrice = 100000m;
    private readonly List<PriceTableRule> _rules = [];

    public PriceTableBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public PriceTableBuilder WithCourtTypeId(Guid courtTypeId)
    {
        _courtTypeId = courtTypeId;
        return this;
    }

    public PriceTableBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public PriceTableBuilder WithActive(bool isActive)
    {
        _isActive = isActive;
        return this;
    }

    public PriceTableBuilder WithDefaultPrice(decimal defaultPrice)
    {
        _defaultPrice = defaultPrice;
        return this;
    }

    public PriceTableBuilder WithRule(
        TimeOnly startTime,
        TimeOnly endTime,
        byte dayFrom = 1,
        byte dayTo = 5,
        decimal fixedPrice = 80000m,
        decimal walkInPrice = 100000m,
        DateOnly? startDate = null,
        DateOnly? endDate = null)
    {
        _rules.Add(new PriceTableRule
        {
            Id = Guid.CreateVersion7(),
            PriceTableId = _id,
            StartDate = startDate,
            EndDate = endDate,
            DayOfWeekFrom = dayFrom,
            DayOfWeekTo = dayTo,
            StartTime = startTime,
            EndTime = endTime,
            FixedCustomerPrice = fixedPrice,
            WalkInCustomerPrice = walkInPrice
        });
        return this;
    }

    public PriceTable Build()
    {
        var priceTable = new PriceTable
        {
            Id = _id,
            CourtTypeId = _courtTypeId,
            Name = _name,
            IsActive = _isActive,
            DefaultPrice = _defaultPrice,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var rule in _rules)
        {
            rule.PriceTableId = _id;
            priceTable.Rules.Add(rule);
        }

        return priceTable;
    }
}
