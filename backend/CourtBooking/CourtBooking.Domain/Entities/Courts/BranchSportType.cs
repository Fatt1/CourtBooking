namespace CourtBooking.Domain.Entities.Courts;

public sealed class BranchSportType
{
    public Guid BranchId { get; set; }
    public Guid SportTypeId { get; set; }
    public Branch Branch { get; set; } = null!;
    public SportType SportType { get; set; } = null!;
}
