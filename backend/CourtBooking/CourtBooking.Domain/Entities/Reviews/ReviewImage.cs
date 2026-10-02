using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Entities.Images;

namespace CourtBooking.Domain.Entities.Reviews;

public class ReviewImage : EntityBase<Guid>
{
    public Guid ReviewId { get; set; }
    public Guid ImageId { get; set; }

    public Review Review { get; set; } = null!;
    public Image Image { get; set; } = null!;
}
