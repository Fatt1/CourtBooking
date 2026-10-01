using CourtBooking.Application.Features.V1.ServiceCategories.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Queries.GetServiceCategories;

public sealed record GetServiceCategoriesQuery(
    string? Search = null,
    bool? IsActive = null) : IQuery<IReadOnlyList<ServiceCategoryDto>>;
