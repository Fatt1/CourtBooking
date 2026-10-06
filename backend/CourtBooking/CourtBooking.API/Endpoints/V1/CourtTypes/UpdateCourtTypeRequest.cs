namespace CourtBooking.API.Endpoints.V1.CourtTypes;

public sealed record UpdateCourtTypeRequest(
    string Name,
    int MinutesConfig);
