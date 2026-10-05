namespace CourtBooking.API.Endpoints.V1.SportTypes;

public sealed record UpdateSportTypeRequest(
    string Name,
    Guid? ImageId);
