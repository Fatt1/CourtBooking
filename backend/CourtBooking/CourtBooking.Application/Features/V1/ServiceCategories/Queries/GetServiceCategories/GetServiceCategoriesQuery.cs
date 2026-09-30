using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.ServiceCategories.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Queries.GetServiceCategories;

public sealed record GetServiceCategoriesQuery(
    string? Search = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<ServiceCategoryDto>>;
