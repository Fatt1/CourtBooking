using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetOwnerServices;

internal sealed class GetOwnerServicesHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetOwnerServicesQuery, PagedList<OwnerServiceDto>>
{
    public async Task<Result<PagedList<OwnerServiceDto>>> Handle(
        GetOwnerServicesQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;

        // 1. Base query lọc các dịch vụ theo chi nhánh của chủ sân
        var baseQuery = dbContext.Services
            .AsNoTracking()
            .Where(s => s.Branches.Any(sb => sb.Branch.CourtOwnerId == currentUserId));

        if (request.BranchId.HasValue)
        {
            baseQuery = baseQuery.Where(s => s.Branches.Any(sb => sb.BranchId == request.BranchId.Value));
        }

        if (request.CategoryId.HasValue)
        {
            baseQuery = baseQuery.Where(s => s.CategoryId == request.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            baseQuery = baseQuery.Where(s => s.Name.ToLower().Contains(term));
        }

        // 2. Đếm tổng số bản ghi
        var totalCount = await baseQuery.CountAsync(cancellationToken);

        // 3. Phân trang và chiếu trực tiếp sang DTO thông qua Navigation properties
        var items = await baseQuery
            .OrderByDescending(s => s.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new OwnerServiceDto(
                s.Id,
                s.Name,
                s.Unit,
                s.CategoryId,
                s.Image != null ? new ImageDto(s.Image.StorageKey, s.Image.Id) : null,
                s.CreatedAt,
                s.UpdatedAt,
                s.Branches
                    .Where(sb => sb.Branch.CourtOwnerId == currentUserId)
                    .Select(sb => new OwnerServiceBranchDto(
                        sb.BranchId,
                        sb.Branch.Name,
                        sb.Price,
                        sb.IsActive
                    ))
                    .ToList()
            ))
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        var pagedList = new PagedList<OwnerServiceDto>(items, totalCount, request.Page, request.PageSize);
        return Result.Success(pagedList);
    }
}
