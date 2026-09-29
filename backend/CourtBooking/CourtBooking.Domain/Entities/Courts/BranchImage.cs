using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Hình ảnh chi nhánh - child entity của Branch.
/// </summary>
public class BranchImage : EntityBase<Guid>
{
    public BranchImage() { }

    public Guid BranchId { get; set; }
    public Guid ImageId { get; set; }
    public int DisplayOrder { get; set; }

    // Navigation
    public Branch Branch { get; set; } = null!;
    public Images.Image Image { get; set; } = null!;
}
