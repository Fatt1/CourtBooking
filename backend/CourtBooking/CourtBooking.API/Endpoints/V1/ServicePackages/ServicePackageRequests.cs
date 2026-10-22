namespace CourtBooking.API.Endpoints.V1.ServicePackages;

public sealed record CreateServicePackageRequest(
    string Name,
    decimal Price,
    string Description,
    short DurationMonths);

public sealed record UpdateServicePackageRequest(
    string Name,
    decimal Price,
    string Description,
    short DurationMonths);
