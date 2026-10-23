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
        // 1. Tải toàn bộ Loại sân trong chi nhánh kèm các dữ liệu liên quan (lọc active và sắp xếp ngay từ database)
        var courtTypes = await dbContext.CourtTypes
            .AsNoTracking()
            .AsSplitQuery()
            .Where(ct => ct.BranchId == request.BranchId && ct.Branch.IsActive)
            .Include(ct => ct.Courts.Where(c => c.Status != CourtStatus.Inactive).OrderBy(c => c.Name))
            .Include(ct => ct.PriceTables.Where(pt => pt.IsActive).OrderBy(pt => pt.Name))
                .ThenInclude(pt => pt.Rules)
            .Include(ct => ct.FixedTimeBlocks.OrderBy(ftb => ftb.StartTime))
                .ThenInclude(ftb => ftb.Courts.Where(ftbc => ftbc.Court.Status != CourtStatus.Inactive))
                    .ThenInclude(ftbc => ftbc.Court)
            .OrderBy(ct => ct.Name)
            .ToListAsync(cancellationToken);

        // 2. Tối ưu Fast-Path: Nếu không tìm thấy loại sân nào, mới kiểm tra chi nhánh có tồn tại và đang hoạt động không
        // Tiết kiệm 1 network round-trip đến database cho hầu hết mọi request thông thường
        if (courtTypes.Count == 0)
        {
            var branchExists = await dbContext.Branches.AsNoTracking()
                .AnyAsync(b => b.Id == request.BranchId && b.IsActive, cancellationToken);

            if (!branchExists)
            {
                return Result.Failure<IReadOnlyList<CourtTypePricingConfigDto>>(new NotFoundError("Branch", request.BranchId));
            }

            return Result.Success<IReadOnlyList<CourtTypePricingConfigDto>>([]);
        }

        // 3. Ánh xạ danh sách loại sân sang DTO thông qua Mapper dùng chung (DB đã lọc active sẵn)
        var response = courtTypes
            .Select(ct => ct.ToPricingConfigDto())
            .ToList();

        return Result.Success<IReadOnlyList<CourtTypePricingConfigDto>>(response);
    }
}
