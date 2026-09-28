using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Hình ảnh chi nhánh - child entity của Branch.
/// </summary>
public class BranchImage : EntityBase<Guid>
{
    private BranchImage() { } // EF Core

    public Guid BranchId { get; private set; }
    public Guid ImageId { get; private set; }
    public int DisplayOrder { get; private set; }

    // Navigation
    public Branch Branch { get; private set; } = null!;

    internal static BranchImage Create(Guid branchId, Guid imageId, int displayOrder)
    {
        return new BranchImage
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            ImageId = imageId,
            DisplayOrder = displayOrder
        };
    }

    internal void UpdateDisplayOrder(int displayOrder) { }
}
