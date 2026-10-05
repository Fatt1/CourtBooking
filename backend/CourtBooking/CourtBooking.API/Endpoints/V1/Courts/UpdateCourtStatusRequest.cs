using CourtBooking.Domain.Enums;
namespace CourtBooking.API.Endpoints.V1.Courts;

public sealed record UpdateCourtStatusRequest(CourtStatus Status);
