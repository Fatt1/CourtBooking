using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetServiceById;

internal sealed class GetServiceByIdHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetServiceByIdQuery, OwnerServiceDto>
{
    public async Task<Result<OwnerServiceDto>> Handle(
        GetServiceByIdQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;

        // 1. Lấy danh sách các chi nhánh thuộc sở hữu của chủ sân hiện tại
        var ownerBranches = await dbContext.Branches
            .AsNoTracking()
            .Where(b => b.CourtOwnerId == currentUserId)
            .Select(b => new { b.Id, b.Name })
            .ToListAsync(cancellationToken);

        var ownerBranchDict = ownerBranches.ToDictionary(b => b.Id, b => b.Name);
        var ownerBranchIds = ownerBranchDict.Keys.ToList();

        if (ownerBranchIds.Count == 0)
        {
            return Result.Failure<OwnerServiceDto>(new NotFoundError("Service", request.Id));
        }

        // 2. Tải Service cùng danh sách ServiceBranch thuộc các chi nhánh của chủ sân
        var service = await dbContext.Services
            .AsNoTracking()
            .Where(s => s.Id == request.Id && s.Branches.Any(sb => ownerBranchIds.Contains(sb.BranchId)))
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Unit,
                s.CategoryId,
                s.ImageId,
                s.CreatedAt,
                s.UpdatedAt,
                Branches = s.Branches
                    .Where(sb => ownerBranchIds.Contains(sb.BranchId))
                    .Select(sb => new
                    {
                        sb.BranchId,
                        sb.Price,
                        sb.IsActive
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (service is null)
        {
            return Result.Failure<OwnerServiceDto>(new NotFoundError("Service", request.Id));
        }

        // 3. Tải thông tin Image nếu có
        ImageDto? imageDto = null;
        if (service.ImageId.HasValue)
        {
            imageDto = await dbContext.Images
                .AsNoTracking()
                .Where(i => i.Id == service.ImageId.Value)
                .Select(i => new ImageDto(i.StorageKey, i.Id))
                .FirstOrDefaultAsync(cancellationToken);
        }

        // 4. Ghép tên chi nhánh và trả về DTO
        var response = new OwnerServiceDto(
            service.Id,
            service.Name,
            service.Unit,
            service.CategoryId,
            imageDto,
            service.CreatedAt,
            service.UpdatedAt,
            service.Branches.Select(sb => new OwnerServiceBranchDto(
                sb.BranchId,
                ownerBranchDict.TryGetValue(sb.BranchId, out var bName) ? bName : string.Empty,
                sb.Price,
                sb.IsActive
            )).ToList());

        return Result.Success(response);
    }
}
