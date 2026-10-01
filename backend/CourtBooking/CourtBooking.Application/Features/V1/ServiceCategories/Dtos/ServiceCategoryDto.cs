namespace CourtBooking.Application.Features.V1.ServiceCategories.Dtos;

public sealed record ServiceCategoryDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    int ServiceCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);
