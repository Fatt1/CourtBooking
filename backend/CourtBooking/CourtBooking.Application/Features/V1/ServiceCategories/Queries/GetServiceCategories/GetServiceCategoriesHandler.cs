using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServiceCategories.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Queries.GetServiceCategories;

internal sealed class GetServiceCategoriesHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetServiceCategoriesQuery, IReadOnlyList<ServiceCategoryDto>>
{
    public async Task<Result<IReadOnlyList<ServiceCategoryDto>>> Handle(
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

        var categories = await query
            .OrderBy(category => category.Name)
            .Select(category => new ServiceCategoryDto(
                category.Id,
                category.Name,
                category.Description,
                category.IsActive,
                category.Services.Count,
                category.CreatedAt,
                category.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<ServiceCategoryDto>>(categories);
    }
}
