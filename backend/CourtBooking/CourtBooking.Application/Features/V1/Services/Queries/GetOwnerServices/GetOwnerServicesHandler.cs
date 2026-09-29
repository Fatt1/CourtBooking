using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Services.Dtos;
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

        // 1. Query danh sách dịch vụ của chủ sân (lọc theo các chi nhánh thuộc chủ sân)
        var query = dbContext.Services
            .AsNoTracking()
            .Where(s => s.Branches.Any(sb => dbContext.Branches.Any(b => b.Id == sb.BranchId && b.CourtOwnerId == currentUserId)));

        if (request.BranchId.HasValue)
        {
            query = query.Where(s => s.Branches.Any(sb => sb.BranchId == request.BranchId.Value));
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == request.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(term));
        }

        var projectedQuery = query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new OwnerServiceItem(
                s.Id,
                s.Name,
                s.Unit,
                s.CategoryId,
                s.ImageId,
                s.CreatedAt,
                s.UpdatedAt,
                s.Branches
                    .Where(sb => dbContext.Branches.Any(b => b.Id == sb.BranchId && b.CourtOwnerId == currentUserId))
                    .Select(sb => new OwnerServiceBranchDto(
                        sb.BranchId,
                        dbContext.Branches.Where(b => b.Id == sb.BranchId).Select(b => b.Name).FirstOrDefault()!,
                        sb.Price,
                        sb.IsActive
                    ))
                    .ToList()
            ));

        // Câu Query 1: Phân trang dùng PagedList.CreateAsync
        var pagedServices = await PagedList<OwnerServiceItem>.CreateAsync(
            projectedQuery, request.Page, request.PageSize, cancellationToken);

        // Câu Query 2: Lấy hình ảnh dùng WHERE IN
        var imageIds = pagedServices.Items
            .Where(s => s.ImageId.HasValue)
            .Select(s => s.ImageId!.Value)
            .Distinct()
            .ToList();

        var imageDict = imageIds.Count > 0
            ? await dbContext.Images
                .AsNoTracking()
                .Where(i => imageIds.Contains(i.Id))
                .ToDictionaryAsync(i => i.Id, i => new ImageDto(i.StorageKey, i.Id), cancellationToken)
            : [];

        // Ghép Image vào DTO kết quả
        var items = pagedServices.Items.Select(s => new OwnerServiceDto(
            s.Id,
            s.Name,
            s.Unit,
            s.CategoryId,
            s.ImageId.HasValue && imageDict.TryGetValue(s.ImageId.Value, out var img) ? img : null,
            s.CreatedAt,
            s.UpdatedAt,
            s.Branches
        )).ToList();

        var result = new PagedList<OwnerServiceDto>(
            items,
            pagedServices.TotalCount,
            pagedServices.Page,
            pagedServices.PageSize);

        return Result.Success(result);
    }

    private sealed record OwnerServiceItem(
        Guid Id,
        string Name,
        string Unit,
        Guid CategoryId,
        Guid? ImageId,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        IReadOnlyList<OwnerServiceBranchDto> Branches);
}
