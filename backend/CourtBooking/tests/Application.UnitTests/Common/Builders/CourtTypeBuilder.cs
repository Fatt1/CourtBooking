using CourtBooking.Domain.Entities.Courts;

namespace Application.UnitTests.Common.Builders;

public sealed class CourtTypeBuilder
{
    private Guid _id = Guid.CreateVersion7();
    private Guid _branchId = Guid.CreateVersion7();
    private string _name = "Sân Cầu Lông Tiêu Chuẩn";
    private int _minutesConfig = 60;
    private readonly List<Court> _courts = [];
    private readonly List<PriceTable> _priceTables = [];
    private readonly List<FixedTimeBlock> _fixedTimeBlocks = [];

    public CourtTypeBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public CourtTypeBuilder WithBranchId(Guid branchId)
    {
        _branchId = branchId;
        return this;
    }

    public CourtTypeBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public CourtTypeBuilder WithMinutesConfig(int minutes)
    {
        _minutesConfig = minutes;
        return this;
    }

    public CourtTypeBuilder WithCourt(Court court)
    {
        _courts.Add(court);
        return this;
    }

    public CourtTypeBuilder WithPriceTable(PriceTable priceTable)
    {
        _priceTables.Add(priceTable);
        return this;
    }

    public CourtTypeBuilder WithFixedTimeBlock(FixedTimeBlock block)
    {
        _fixedTimeBlocks.Add(block);
        return this;
    }

    public CourtType Build()
    {
        var courtType = new CourtType
        {
            Id = _id,
            BranchId = _branchId,
            Name = _name,
            MinutesConfig = _minutesConfig
        };

        foreach (var court in _courts)
        {
            court.CourtTypeId = _id;
            courtType.Courts.Add(court);
        }

        foreach (var pt in _priceTables)
        {
            pt.CourtTypeId = _id;
            courtType.PriceTables.Add(pt);
        }

        foreach (var block in _fixedTimeBlocks)
        {
            block.CourtTypeId = _id;
            courtType.FixedTimeBlocks.Add(block);
        }

        return courtType;
    }
}
