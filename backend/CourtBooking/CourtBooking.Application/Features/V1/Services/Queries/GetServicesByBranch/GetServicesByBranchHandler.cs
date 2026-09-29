using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetServicesByBranch;

internal sealed class GetServicesByBranchHandler(
    IApplicationDbContext dbContext) : IQueryHandler<GetServicesByBranchQuery, List<ServiceByBranchDto>>
{
    public async Task<Result<List<ServiceByBranchDto>>> Handle(
        GetServicesByBranchQuery request,
        CancellationToken cancellationToken)
    {
        var branchExists = await dbContext.Branches
            .AnyAsync(b => b.Id == request.BranchId, cancellationToken);

        if (!branchExists)
        {
            return Result.Failure<List<ServiceByBranchDto>>(new NotFoundError("Branch", request.BranchId));
        }

        var query = dbContext.ServiceBranches
            .AsNoTracking()
            .Where(sb => sb.BranchId == request.BranchId);

        if (request.IsActive.HasValue)
        {
            query = query.Where(sb => sb.IsActive == request.IsActive.Value);
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(sb => sb.Service.CategoryId == request.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var search = request.SearchTerm.Trim().ToLower();
            query = query.Where(sb => sb.Service.Name.ToLower().Contains(search));
        }

        var result = await query
            .OrderBy(sb => sb.Service.Name)
            .Select(sb => new ServiceByBranchDto(
                sb.ServiceId,
                sb.Service.Name,
                sb.Service.Unit,
                sb.Service.CategoryId,
                sb.Service.Image != null ? new ImageDto(sb.Service.Image.StorageKey, sb.Service.Image.Id) : null,
                sb.BranchId,
                sb.Price,
                sb.IsActive,
                sb.Service.CreatedAt,
                sb.Service.UpdatedAt
            ))
            .ToListAsync(cancellationToken);

        return Result.Success(result);
    }
}
