using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.DeletePriceTable;

internal sealed class DeletePriceTableHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<DeletePriceTableCommand>
{
    public async Task<Result> Handle(
        DeletePriceTableCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        // 2. Tải bảng giá và kiểm tra thuộc chi nhánh
        var priceTable = await dbContext.PriceTables
            .Include(pt => pt.CourtType)
            .FirstOrDefaultAsync(pt => pt.Id == request.PriceTableId, cancellationToken);

        if (priceTable is null || priceTable.CourtType.BranchId != request.BranchId)
        {
            return Result.Failure(new NotFoundError("PriceTable", request.PriceTableId));
        }

        // 3. Xóa bảng giá (EF Core sẽ cascade delete các PriceTableRule tương ứng theo cấu hình DB)
        dbContext.PriceTables.Remove(priceTable);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
