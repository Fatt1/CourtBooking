namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Liên kết dịch vụ với chi nhánh cụ thể (giá và trạng thái theo từng chi nhánh).
/// Child entity của Service aggregate (Composite Key: ServiceId, BranchId).
/// </summary>
public class ServiceBranch
{
    private ServiceBranch() { } // EF Core

    public Guid ServiceId { get; private set; }
    public Guid BranchId { get; private set; }
    public bool IsActive { get; private set; }
    public decimal Price { get; private set; }

    // Navigation
    public Service Service { get; private set; } = null!;

    internal static ServiceBranch Create(Guid serviceId, Guid branchId, decimal price, bool isActive = true)
    {
        return new ServiceBranch
        {
            ServiceId = serviceId,
            BranchId = branchId,
            Price = price,
            IsActive = isActive
        };
    }

    internal void UpdatePrice(decimal price)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(price);
        Price = price;
    }

    internal void Activate()
    {
        IsActive = true;
    }

    internal void Deactivate()
    {
        IsActive = false;
    }
}
