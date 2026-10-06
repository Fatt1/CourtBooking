using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Features.V1.Pricing.Mappers;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByBranchId;

internal sealed class GetPricingConfigByBranchIdHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetPricingConfigByBranchIdQuery, IReadOnlyList<CourtTypePricingConfigDto>>
{
    public async Task<Result<IReadOnlyList<CourtTypePricingConfigDto>>> Handle(
        GetPricingConfigByBranchIdQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra chi nhánh có tồn tại và đang hoạt động không
        var branchExists = await dbContext.Branches.AsNoTracking()
            .AnyAsync(b => b.Id == request.BranchId && b.IsActive, cancellationToken);

        if (!branchExists)
        {
            return Result.Failure<IReadOnlyList<CourtTypePricingConfigDto>>(new NotFoundError("Branch", request.BranchId));
        }

        // 2. Tải toàn bộ Loại sân trong chi nhánh kèm các dữ liệu liên quan (chỉ lấy dữ liệu active)
        var courtTypes = await dbContext.CourtTypes
            .AsNoTracking()
            .AsSplitQuery()
            .Where(ct => ct.BranchId == request.BranchId)
            .Include(ct => ct.Courts.Where(c => c.Status != CourtStatus.Inactive))
            .Include(ct => ct.PriceTables.Where(pt => pt.IsActive))
                .ThenInclude(pt => pt.Rules)
            .Include(ct => ct.FixedTimeBlocks)
                .ThenInclude(ftb => ftb.Courts.Where(ftbc => ftbc.Court.Status != CourtStatus.Inactive))
                    .ThenInclude(ftbc => ftbc.Court)
            .OrderBy(ct => ct.Name)
            .ToListAsync(cancellationToken);

        // 3. Ánh xạ danh sách loại sân sang DTO thông qua Mapper dùng chung (chỉ lấy active)
        var response = courtTypes
            .Select(ct => ct.ToPricingConfigDto(onlyActive: true))
            .ToList();

        return Result.Success<IReadOnlyList<CourtTypePricingConfigDto>>(response);
    }
}
