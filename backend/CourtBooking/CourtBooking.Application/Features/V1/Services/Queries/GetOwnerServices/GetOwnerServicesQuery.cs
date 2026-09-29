using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetOwnerServices;

public sealed record GetOwnerServicesQuery(
    string? SearchTerm = null,
    Guid? CategoryId = null,
    Guid? BranchId = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<OwnerServiceDto>>;
