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
    public void UpdateInfo(string name, string unit, Guid? imageId) { }
    public void AssignToBranch(Guid branchId, decimal price) { }
    public void UnassignFromBranch(Guid branchId) { }
    public void UpdateBranchPrice(Guid branchId, decimal price) { }
    public void ActivateInBranch(Guid branchId) { }
    public void DeactivateInBranch(Guid branchId) { }
}
