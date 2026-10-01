using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.DeletePriceTableRule;

internal sealed class DeletePriceTableRuleHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<DeletePriceTableRuleCommand>
{
    public async Task<Result> Handle(
        DeletePriceTableRuleCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        // 2. Tải bảng giá và kiểm tra quy tắc thuộc chi nhánh
        var rule = await dbContext.PriceTableRules
            .Include(r => r.PriceTable)
                .ThenInclude(pt => pt.CourtType)
            .FirstOrDefaultAsync(r => r.Id == request.RuleId && r.PriceTableId == request.PriceTableId, cancellationToken);

        if (rule is null || rule.PriceTable.CourtType.BranchId != request.BranchId)
        {
            return Result.Failure(new NotFoundError("PriceTableRule", request.RuleId));
        }

        // 3. Xóa quy tắc
        dbContext.PriceTableRules.Remove(rule);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
