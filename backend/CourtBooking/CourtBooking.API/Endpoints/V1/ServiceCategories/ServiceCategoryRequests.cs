namespace CourtBooking.API.Endpoints.V1.ServiceCategories;

public sealed record CreateServiceCategoryRequest(
    string Name,
    string? Description,
    bool IsActive = true);

public sealed record UpdateServiceCategoryRequest(
    string Name,
    string? Description,
    bool IsActive);
