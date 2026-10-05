using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Courts.Commands.DeleteCourt;

internal sealed class DeleteCourtHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : ICommandHandler<DeleteCourtCommand>
{
    public async Task<Result> Handle(
        DeleteCourtCommand request,
        CancellationToken cancellationToken)
    {
        var court = await dbContext.Courts
            .Include(c => c.CourtType)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (court is null)
        {
            return Result.Failure(new NotFoundError("Court", request.Id));
        }

        var authResult = await branchAuth.EnsureOwnerAsync(court.CourtType.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        // 1. Kiểm tra nếu sân đã từng có đơn đặt sân (OrderDetails)
        var hasOrders = await dbContext.OrderDetails
            .AnyAsync(od => od.CourtId == request.Id, cancellationToken);

        if (hasOrders)
        {
            return Result.Failure(new ConflictError(
                "Không thể xóa sân vì đã có lịch sử đặt sân. Bạn có thể chuyển trạng thái sang Bảo trì."));
        }

        // 2. Kiểm tra nếu sân đang nằm trong khung giờ cố định (FixedTimeBlocks)
        var hasFixedBlocks = await dbContext.FixedTimeBlockCourts
            .AnyAsync(ftbc => ftbc.CourtId == request.Id, cancellationToken);

        if (hasFixedBlocks)
        {
            return Result.Failure(new ConflictError(
                "Không thể xóa sân vì đang được gán vào khung giờ cố định. Vui lòng gỡ bỏ cấu hình này trước."));
        }

        // 3. Kiểm tra nếu sân đang nằm trong cấu hình lịch cố định định kỳ (FixedOrderConfigs)
        var hasFixedOrderConfigs = await dbContext.FixedOrderConfigCourts
            .AnyAsync(focc => focc.CourtId == request.Id, cancellationToken);

        if (hasFixedOrderConfigs)
        {
            return Result.Failure(new ConflictError(
                "Không thể xóa sân vì đang được gán vào cấu hình đặt lịch định kỳ. Vui lòng gỡ bỏ cấu hình này trước."));
        }

        dbContext.Courts.Remove(court);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
