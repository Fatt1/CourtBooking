using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Entities.Users;

namespace Application.UnitTests.Common.Builders;

public sealed class ServiceCategoryBuilder
{
    private Guid _id = Guid.NewGuid();
    private Guid _courtOwnerId = Guid.NewGuid();
    private string _name = "Danh mục Test";
    private string? _description = "Mô tả danh mục test";
    private bool _isActive = true;
    private DateTime _createdAt = DateTime.UtcNow;
    private DateTime _updatedAt = DateTime.UtcNow;
    private CourtOwner? _courtOwner;
    private readonly List<Service> _services = [];

    public ServiceCategoryBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public ServiceCategoryBuilder WithCourtOwnerId(Guid courtOwnerId)
    {
        _courtOwnerId = courtOwnerId;
        return this;
    }

    public ServiceCategoryBuilder WithCourtOwner(CourtOwner courtOwner)
    {
        _courtOwner = courtOwner;
        _courtOwnerId = courtOwner.Id;
        return this;
    }

    public ServiceCategoryBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public ServiceCategoryBuilder WithDescription(string? description)
    {
        _description = description;
        return this;
    }

    public ServiceCategoryBuilder WithIsActive(bool isActive)
    {
        _isActive = isActive;
        return this;
    }

    public ServiceCategoryBuilder WithCreatedAt(DateTime createdAt)
    {
        _createdAt = createdAt;
        _updatedAt = createdAt;
        return this;
    }

    public ServiceCategoryBuilder WithService(Service service)
    {
        _services.Add(service);
        return this;
    }

    public ServiceCategory Build()
    {
        var category = new ServiceCategory
        {
            Id = _id,
            CourtOwnerId = _courtOwnerId,
            Name = _name,
            Description = _description,
            IsActive = _isActive,
            CreatedAt = _createdAt,
            UpdatedAt = _updatedAt,
            Services = [.. _services]
        };

        if (_courtOwner is not null)
        {
            category.CourtOwner = _courtOwner;
        }

        foreach (var service in category.Services)
        {
            service.CategoryId = category.Id;
            service.Category = category;
        }

        return category;
    }
}
