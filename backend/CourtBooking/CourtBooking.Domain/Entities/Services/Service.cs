using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Dịch vụ bổ sung (VD: Nước suối, Vợt cầu lông).
/// Aggregate Root - có thể được bán ở nhiều chi nhánh với giá khác nhau (ServiceBranch).
/// </summary>
public class Service : AggregateRoot<Guid>, IAuditable
{
    private Service() { } // EF Core

    private readonly List<ServiceBranch> _branches = [];

    public Guid CategoryId { get; private set; }
    public string Name { get; private set; } = null!;
    public string Unit { get; private set; } = null!;
    public Guid? ImageId { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<ServiceBranch> Branches => _branches.AsReadOnly();

    // --- Factory ---
    public static Service Create(Guid categoryId, string name, string unit, Guid? imageId = null)
    {
        return new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = categoryId,
            Name = name,
            Unit = unit,
            ImageId = imageId
        };
    }

    // --- Domain Methods ---
    public Guid? UpdateInfo(Guid categoryId, string name, string unit, Guid? newImageId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(unit);

        CategoryId = categoryId;
        Name = name.Trim();
        Unit = unit.Trim();

        var oldImageId = ImageId;
        if (ImageId != newImageId)
        {
            ImageId = newImageId;
            return oldImageId;
        }

        return null;
    }

    public void AssignToBranch(Guid branchId, decimal price, bool isActive = true)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(price);


        _branches.Add(ServiceBranch.Create(Id, branchId, price, isActive));
    }

    public bool UnassignFromBranch(Guid branchId)
    {
        var existing = _branches.Find(b => b.BranchId == branchId);
        if (existing is not null)
        {
            return _branches.Remove(existing);
        }

        return false;
    }

    public void UpdateBranchPrice(Guid branchId, decimal price)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(price);

        var existing = _branches.Find(b => b.BranchId == branchId)
            ?? throw new InvalidOperationException($"Dịch vụ '{Name}' chưa được liên kết với chi nhánh '{branchId}'.");

        existing.UpdatePrice(price);
    }

    public void ActivateInBranch(Guid branchId)
    {
        var existing = _branches.Find(b => b.BranchId == branchId)
            ?? throw new InvalidOperationException($"Dịch vụ '{Name}' chưa được liên kết với chi nhánh '{branchId}'.");

        existing.Activate();
    }


    public void DeactivateInBranch(Guid branchId)
    {
        var existing = _branches.Find(b => b.BranchId == branchId)
            ?? throw new InvalidOperationException($"Dịch vụ '{Name}' chưa được liên kết với chi nhánh '{branchId}'.");

        existing.Deactivate();
    }
}
