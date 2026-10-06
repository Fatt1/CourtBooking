namespace CourtBooking.API.Endpoints.V1.SportTypes;

public sealed record CreateSportTypeRequest(
    string Name,
    Guid ImageId);
