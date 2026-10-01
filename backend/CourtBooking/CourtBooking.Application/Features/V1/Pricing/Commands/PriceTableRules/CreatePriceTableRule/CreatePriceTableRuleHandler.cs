using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.CreatePriceTableRule;

internal sealed class CreatePriceTableRuleHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<CreatePriceTableRuleCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreatePriceTableRuleCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<Guid>(authResult.Error!);
        }

        // 2. Tải bảng giá và danh sách quy tắc hiện có
        var priceTable = await dbContext.PriceTables
            .Include(pt => pt.CourtType)
            .Include(pt => pt.Rules)
            .FirstOrDefaultAsync(pt => pt.Id == request.PriceTableId, cancellationToken);

        if (priceTable is null || priceTable.CourtType.BranchId != request.BranchId)
        {
            return Result.Failure<Guid>(new NotFoundError("PriceTable", request.PriceTableId));
        }

        // 3. Kiểm tra trùng lấn/chồng chéo thời gian (Overlap) trên cùng bảng giá và thứ
        var hasOverlap = PriceTableRuleOverlapChecker.HasOverlap(
            priceTable.Rules,
            request.StartDate,
            request.EndDate,
            request.DayOfWeekFrom,
            request.DayOfWeekTo,
            request.StartTime,
            request.EndTime);

        if (hasOverlap)
        {
            return Result.Failure<Guid>(
                new ConflictError($"Khung giờ {request.StartTime:HH:mm} - {request.EndTime:HH:mm} bị trùng lấn với quy tắc đã có trong cùng bảng giá."));
        }

        // 4. Khởi tạo và lưu quy tắc mới (Bắt buộc dùng Guid.CreateVersion7())
        var rule = new PriceTableRule
        {
            Id = Guid.CreateVersion7(),
            PriceTableId = request.PriceTableId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            DayOfWeekFrom = request.DayOfWeekFrom,
            DayOfWeekTo = request.DayOfWeekTo,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            FixedCustomerPrice = request.FixedCustomerPrice,
            WalkInCustomerPrice = request.WalkInCustomerPrice
        };

        await dbContext.PriceTableRules.AddAsync(rule, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(rule.Id);
    }
}
