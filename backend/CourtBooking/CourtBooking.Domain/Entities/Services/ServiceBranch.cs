namespace CourtBooking.Domain.Entities.Services;

/// <summary>
/// Liên kết dịch vụ với chi nhánh cụ thể (giá và trạng thái theo từng chi nhánh).
/// (Composite Key: ServiceId, BranchId).
/// </summary>
public class ServiceBranch
{
    public ServiceBranch() { }

    public Guid ServiceId { get; set; }
    public Guid BranchId { get; set; }
    public bool IsActive { get; set; }
    public decimal Price { get; set; }

    // Navigation
    public Service Service { get; set; } = null!;
    public Courts.Branch Branch { get; set; } = null!;
}
