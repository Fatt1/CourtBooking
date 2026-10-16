using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Events;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.DeletePriceTable;

internal sealed class DeletePriceTableHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth,
    IPublisher publisher) : ICommandHandler<DeletePriceTableCommand>
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

        // 3. Kiểm tra ràng buộc: Mỗi loại sân phải giữ lại ít nhất 1 bảng giá
        var tableCount = await dbContext.PriceTables
            .CountAsync(pt => pt.CourtTypeId == priceTable.CourtTypeId, cancellationToken);

        if (tableCount <= 1)
        {
            return Result.Failure(new ConflictError("Mỗi loại sân phải có ít nhất một bảng giá, không thể xóa bảng giá cuối cùng."));
        }

        // 4. Xóa bảng giá (EF Core sẽ cascade delete các PriceTableRule tương ứng theo cấu hình DB)
        dbContext.PriceTables.Remove(priceTable);
        await dbContext.SaveChangesAsync(cancellationToken);

        // 5. Phát sự kiện cập nhật lại khoảng giá của chi nhánh
        await publisher.Publish(new BranchPriceChangedEvent(request.BranchId), cancellationToken);

        return Result.Success();
    }
}
