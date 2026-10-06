using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Features.V1.Pricing.Mappers;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByCourtType;

internal sealed class GetPricingConfigByCourtTypeHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : IQueryHandler<GetPricingConfigByCourtTypeQuery, CourtTypePricingConfigDto>
{
    public async Task<Result<CourtTypePricingConfigDto>> Handle(
        GetPricingConfigByCourtTypeQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<CourtTypePricingConfigDto>(authResult.Error!);
        }

        // 2. Tải Loại sân kèm các Sân con, Bảng giá, Quy tắc giá và Khung giờ bắt buộc
        var courtType = await dbContext.CourtTypes
            .AsNoTracking()
            .AsSplitQuery()
            .Include(ct => ct.Courts)
            .Include(ct => ct.PriceTables)
                .ThenInclude(pt => pt.Rules)
            .Include(ct => ct.FixedTimeBlocks)
                .ThenInclude(ftb => ftb.Courts)
                    .ThenInclude(ftbc => ftbc.Court)
            .FirstOrDefaultAsync(ct => ct.Id == request.CourtTypeId && ct.BranchId == request.BranchId, cancellationToken);

        if (courtType is null)
        {
            return Result.Failure<CourtTypePricingConfigDto>(new NotFoundError("CourtType", request.CourtTypeId));
        }

        // 3. Ánh xạ dữ liệu sang DTO thông qua Mapper dùng chung
        return Result.Success(courtType.ToPricingConfigDto());
    }
}
