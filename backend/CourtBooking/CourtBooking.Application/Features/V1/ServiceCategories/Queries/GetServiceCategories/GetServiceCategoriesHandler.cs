using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.ServiceCategories.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Queries.GetServiceCategories;

internal sealed class GetServiceCategoriesHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetServiceCategoriesQuery, PagedList<ServiceCategoryDto>>
{
    public async Task<Result<PagedList<ServiceCategoryDto>>> Handle(
        GetServiceCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ServiceCategories
            .AsNoTracking()
            .Where(category => category.CourtOwnerId == userContext.UserId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(category => category.Name.Contains(search));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(category => category.IsActive == request.IsActive.Value);
        }

        var projectedQuery = query
            .OrderBy(category => category.Name)
            .Select(category => new ServiceCategoryDto(
                category.Id,
                category.Name,
                category.Description,
                category.IsActive,
                category.Services.Count,
                category.CreatedAt,
                category.UpdatedAt));

        var result = await PagedList<ServiceCategoryDto>.CreateAsync(
            projectedQuery,
            request.Page,
            request.PageSize,
            cancellationToken);

        return Result.Success(result);
    }
}
