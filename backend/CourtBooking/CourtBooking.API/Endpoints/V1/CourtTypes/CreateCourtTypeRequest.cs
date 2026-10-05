namespace CourtBooking.API.Endpoints.V1.CourtTypes;

public sealed record CreateCourtTypeRequest(
    string Name,
    int MinutesConfig);
