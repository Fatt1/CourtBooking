using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Services;

namespace Application.UnitTests.Common.Builders;

public sealed class ServiceBuilder
{
    private Guid _id = Guid.NewGuid();
    private Guid _categoryId = Guid.NewGuid();
    private string _name = "Dịch vụ Test";
    private string _unit = "Chai";
    private Guid? _imageId;
    private Image? _image;
    private ServiceCategory? _category;
    private readonly List<ServiceBranch> _branches = [];
    private readonly DateTime _createdAt = DateTime.UtcNow;
    private readonly DateTime _updatedAt = DateTime.UtcNow;

    public ServiceBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public ServiceBuilder WithCategoryId(Guid categoryId)
    {
        _categoryId = categoryId;
        return this;
    }

    public ServiceBuilder WithCategory(ServiceCategory category)
    {
        _category = category;
        _categoryId = category.Id;
        return this;
    }

    public ServiceBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public ServiceBuilder WithUnit(string unit)
    {
        _unit = unit;
        return this;
    }

    public ServiceBuilder WithImage(Image image)
    {
        _image = image;
        _imageId = image.Id;
        return this;
    }

    public ServiceBuilder WithImageId(Guid? imageId)
    {
        _imageId = imageId;
        return this;
    }

    public ServiceBuilder WithBranch(Guid branchId, decimal price, bool isActive = true)
    {
        _branches.Add(new ServiceBranch
        {
            ServiceId = _id,
            BranchId = branchId,
            Price = price,
            IsActive = isActive
        });
        return this;
    }

    public Service Build()
    {
        var service = new Service
        {
            Id = _id,
            CategoryId = _categoryId,
            Name = _name,
            Unit = _unit,
            ImageId = _imageId,
            Image = _image,
            CreatedAt = _createdAt,
            UpdatedAt = _updatedAt,
            Branches = [.. _branches]
        };

        if (_category is not null)
        {
            service.Category = _category;
        }

        foreach (var branch in service.Branches)
        {
            branch.ServiceId = service.Id;
            branch.Service = service;
        }

        return service;
    }
}
