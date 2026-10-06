namespace CourtBooking.API.Endpoints.V1.Courts;

public sealed record UpdateCourtRequest(
    string Name,
    Guid CourtTypeId);
