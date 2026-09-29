using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Reviews;

/// <summary>
/// Đánh giá chi nhánh sau khi sử dụng sân.
/// </summary>
public class Review : EntityBase<Guid>
{
    public Review() { }

    public Guid BranchId { get; set; }
    public Guid OrderId { get; set; }
    public Guid PlayerId { get; set; }
    public byte Rating { get; set; }
    public string? Comment { get; set; }
    public Guid? ImageId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Courts.Branch Branch { get; set; } = null!;
    public Orders.Order Order { get; set; } = null!;
    public Users.ApplicationUser Player { get; set; } = null!;
    public Images.Image? Image { get; set; }
}
