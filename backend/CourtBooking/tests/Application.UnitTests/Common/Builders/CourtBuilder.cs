using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;

namespace Application.UnitTests.Common.Builders;

public sealed class CourtBuilder
{
    private Guid _id = Guid.NewGuid();
    private Guid _courtTypeId = Guid.NewGuid();
    private string _name = "Sân 1";
    private CourtStatus _status = CourtStatus.Available;

    public CourtBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public CourtBuilder WithCourtTypeId(Guid courtTypeId)
    {
        _courtTypeId = courtTypeId;
        return this;
    }

    public CourtBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public CourtBuilder WithStatus(CourtStatus status)
    {
        _status = status;
        return this;
    }

    public Court Build() => new()
    {
        Id = _id,
        CourtTypeId = _courtTypeId,
        Name = _name,
        Status = _status,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };
}
