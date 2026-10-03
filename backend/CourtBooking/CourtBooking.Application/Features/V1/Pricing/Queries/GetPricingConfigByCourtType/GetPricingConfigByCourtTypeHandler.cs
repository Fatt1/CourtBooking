using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Helpers;
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

        // 3. Map danh sách sân khả dụng thuộc loại sân này
        var availableCourts = courtType.Courts
            .OrderBy(c => c.Name)
            .Select(c => new AppliedCourtDto(c.Id, c.Name))
            .ToList();

        // 4. Map danh sách Khung giờ bắt buộc kèm giải mã bitmask ngày trong tuần
        var fixedTimeBlocks = courtType.FixedTimeBlocks
            .OrderBy(ftb => ftb.StartTime)
            .Select(ftb =>
            {
                var daysOfWeek = DaysOfWeekMaskHelper.DecodeMask(ftb.DaysOfWeekMask);
                var dayNames = DaysOfWeekMaskHelper.DecodeMaskToNames(ftb.DaysOfWeekMask);
                var appliedCourts = ftb.Courts
                    .Select(c => new AppliedCourtDto(c.CourtId, c.Court.Name))
                    .OrderBy(c => c.CourtName)
                    .ToList();

                return new FixedTimeBlockDto(
                    ftb.Id,
                    ftb.CourtTypeId,
                    ftb.StartTime,
                    ftb.EndTime,
                    ftb.DaysOfWeekMask,
                    daysOfWeek,
                    dayNames,
                    appliedCourts,
                    ftb.CreatedAt,
                    ftb.UpdatedAt);
            })
            .ToList();

        // 5. Map danh sách Bảng giá kèm các quy tắc giá chi tiết bên trong
        var priceTables = courtType.PriceTables
            .OrderByDescending(pt => pt.IsActive)
            .ThenBy(pt => pt.Name)
            .Select(pt =>
            {
                var rules = pt.Rules
                    .OrderBy(r => r.DayOfWeekFrom)
                    .ThenBy(r => r.StartTime)
                    .Select(r => new PriceTableRuleDto(
                        r.Id,
                        r.PriceTableId,
                        r.StartDate,
                        r.EndDate,
                        r.DayOfWeekFrom,
                        r.DayOfWeekTo,
                        DaysOfWeekMaskHelper.GetDayRangeText(r.DayOfWeekFrom, r.DayOfWeekTo),
                        r.StartTime,
                        r.EndTime,
                        r.FixedCustomerPrice,
                        r.WalkInCustomerPrice))
                    .ToList();

                return new PriceTableDto(
                    pt.Id,
                    pt.CourtTypeId,
                    pt.Name,
                    pt.IsActive,
                    pt.DefaultPrice,
                    pt.CreatedAt,
                    pt.UpdatedAt,
                    rules);
            })
            .ToList();

        // 6. Trả về cấu hình tổng hợp dạng cây/nhóm cho Frontend render trực tiếp
        var response = new CourtTypePricingConfigDto(
            courtType.Id,
            courtType.BranchId,
            courtType.Name,
            courtType.MinutesConfig,
            availableCourts,
            fixedTimeBlocks,
            priceTables);

        return Result<CourtTypePricingConfigDto>.Success(response);
    }
}
