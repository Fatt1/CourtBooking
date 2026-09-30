using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServiceCategories.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Queries.GetServiceCategoryById;

internal sealed class GetServiceCategoryByIdHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetServiceCategoryByIdQuery, ServiceCategoryDto>
{
    public async Task<Result<ServiceCategoryDto>> Handle(
        GetServiceCategoryByIdQuery request,
        CancellationToken cancellationToken)
    {
        var category = await dbContext.ServiceCategories
            .AsNoTracking()
            .Where(item => item.Id == request.Id && item.CourtOwnerId == userContext.UserId)
            .Select(item => new ServiceCategoryDto(
                item.Id,
                item.Name,
                item.Description,
                item.IsActive,
                item.Services.Count,
                item.CreatedAt,
                item.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return category is null
            ? Result.Failure<ServiceCategoryDto>(new NotFoundError("ServiceCategory", request.Id))
            : Result.Success(category);
    }
}
