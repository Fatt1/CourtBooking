namespace CourtBooking.API.Endpoints.V1.ServicePackages;

public sealed record CreateServicePackageRequest(
    string Name,
    decimal Price,
    string Description,
    short DurationMonths);
