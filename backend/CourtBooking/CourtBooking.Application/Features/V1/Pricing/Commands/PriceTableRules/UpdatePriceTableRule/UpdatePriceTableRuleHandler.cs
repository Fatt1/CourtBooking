using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.UpdatePriceTableRule;

internal sealed class UpdatePriceTableRuleHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<UpdatePriceTableRuleCommand>
{
    public async Task<Result> Handle(
        UpdatePriceTableRuleCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        // 2. Tải bảng giá và toàn bộ quy tắc để kiểm tra
        var priceTable = await dbContext.PriceTables
            .Include(pt => pt.CourtType)
            .Include(pt => pt.Rules)
            .FirstOrDefaultAsync(pt => pt.Id == request.PriceTableId, cancellationToken);

        if (priceTable is null || priceTable.CourtType.BranchId != request.BranchId)
        {
            return Result.Failure(new NotFoundError("PriceTable", request.PriceTableId));
        }

        // 3. Tìm quy tắc cần cập nhật
        var targetRule = priceTable.Rules.FirstOrDefault(r => r.Id == request.RuleId);
        if (targetRule is null)
        {
            return Result.Failure(new NotFoundError("PriceTableRule", request.RuleId));
        }

        // 4. Kiểm tra trùng lấn thời gian với các quy tắc KHÁC trong cùng bảng giá
        var hasOverlap = PriceTableRuleOverlapChecker.HasOverlap(
            priceTable.Rules,
            request.StartDate,
            request.EndDate,
            request.DayOfWeekFrom,
            request.DayOfWeekTo,
            request.StartTime,
            request.EndTime,
            ignoreRuleId: request.RuleId);

        if (hasOverlap)
        {
            return Result.Failure(
                new ConflictError($"Khung giờ {request.StartTime:HH:mm} - {request.EndTime:HH:mm} bị trùng lấn với quy tắc khác trong cùng bảng giá."));
        }

        // 5. Cập nhật thông tin quy tắc
        targetRule.StartDate = request.StartDate;
        targetRule.EndDate = request.EndDate;
        targetRule.DayOfWeekFrom = request.DayOfWeekFrom;
        targetRule.DayOfWeekTo = request.DayOfWeekTo;
        targetRule.StartTime = request.StartTime;
        targetRule.EndTime = request.EndTime;
        targetRule.FixedCustomerPrice = request.FixedCustomerPrice;
        targetRule.WalkInCustomerPrice = request.WalkInCustomerPrice;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
