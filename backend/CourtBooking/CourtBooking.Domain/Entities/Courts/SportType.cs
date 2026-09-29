using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Loại hình thể thao (Cầu lông, Pickleball, v.v.)
/// </summary>
public class SportType : EntityBase<Guid>
{
    public SportType() { }

    public string Name { get; set; } = null!;
    public Guid? ImageId { get; set; }
    public bool IsActive { get; set; }

    // Navigation properties
    public Images.Image? Image { get; set; }

    public List<Branch> Branches { get; set; } = [];
    public List<Events.SportEvent> Events { get; set; } = [];
    public List<Matches.SocialMatch> SocialMatches { get; set; } = [];
}
