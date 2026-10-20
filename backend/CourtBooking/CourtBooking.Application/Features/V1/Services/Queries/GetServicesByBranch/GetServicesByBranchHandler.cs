using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetServicesByBranch;

internal sealed class GetServicesByBranchHandler(
    IApplicationDbContext dbContext) : IQueryHandler<GetServicesByBranchQuery, List<BranchCategoryServicesDto>>
{
    public async Task<Result<List<BranchCategoryServicesDto>>> Handle(
        GetServicesByBranchQuery request,
        CancellationToken cancellationToken)
    {
        var branchExists = await dbContext.Branches
            .AnyAsync(b => b.Id == request.BranchId, cancellationToken);

        if (!branchExists)
        {
            return Result.Failure<List<BranchCategoryServicesDto>>(new NotFoundError("Branch", request.BranchId));
        }

        var query = dbContext.ServiceBranches
            .AsNoTracking()
            .Where(sb => sb.BranchId == request.BranchId && sb.Service.Category.IsActive);

        if (request.IsActive.HasValue)
        {
            query = query.Where(sb => sb.IsActive == request.IsActive.Value);
        }

        var serviceItems = await query
            .OrderBy(sb => sb.Service.Category.Name)
            .ThenBy(sb => sb.Service.Name)
            .Select(sb => new
            {
                CategoryId = sb.Service.CategoryId,
                CategoryName = sb.Service.Category.Name,
                ServiceId = sb.ServiceId,
                ServiceName = sb.Service.Name,
                Unit = sb.Service.Unit,
                Price = sb.Price,
                IsActive = sb.IsActive,
                Image = sb.Service.Image != null ? new ImageDto(sb.Service.Image.StorageKey, sb.Service.Image.Id) : null
            })
            .ToListAsync(cancellationToken);

        var result = serviceItems
            .GroupBy(s => new { s.CategoryId, s.CategoryName })
            .Select(g => new BranchCategoryServicesDto(
                g.Key.CategoryId,
                g.Key.CategoryName,
                g.Select(s => new BranchServiceItemDto(
                    s.ServiceId,
                    s.ServiceName,
                    s.Unit,
                    s.Price,
                    s.Image,
                    s.IsActive
                )).ToList()
            ))
            .ToList();

        return Result.Success(result);
    }
}
