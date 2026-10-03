using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtTypes.Commands.DeleteCourtType;

internal sealed class DeleteCourtTypeHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : ICommandHandler<DeleteCourtTypeCommand>
{
    public async Task<Result> Handle(
        DeleteCourtTypeCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Tìm loại sân theo Id
        var courtType = await dbContext.CourtTypes
            .FirstOrDefaultAsync(ct => ct.Id == request.Id, cancellationToken);

        if (courtType is null)
        {
            return Result.Failure(new NotFoundError("CourtType", request.Id));
        }

        // 2. Tự động kiểm tra quyền sở hữu đối với chi nhánh của loại sân này
        var authResult = await branchAuth.EnsureOwnerAsync(courtType.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        // 3. Kiểm tra xem có sân con (Courts) nào không
        var hasCourts = await dbContext.Courts
            .AnyAsync(c => c.CourtTypeId == request.Id, cancellationToken);

        if (hasCourts)
        {
            return Result.Failure(
                new ConflictError("Không thể xóa loại sân vì đã có sân con trực thuộc."));
        }

        // 4. Kiểm tra xem có bảng giá (PriceTables) nào không
        var hasPriceTables = await dbContext.PriceTables
            .AnyAsync(pt => pt.CourtTypeId == request.Id, cancellationToken);

        if (hasPriceTables)
        {
            return Result.Failure(
                new ConflictError("Không thể xóa loại sân vì đã có bảng giá cấu hình."));
        }

        // 5. Kiểm tra xem có khung giờ cố định (FixedTimeBlocks) nào không
        var hasFixedTimeBlocks = await dbContext.FixedTimeBlocks
            .AnyAsync(ftb => ftb.CourtTypeId == request.Id, cancellationToken);

        if (hasFixedTimeBlocks)
        {
            return Result.Failure(
                new ConflictError("Không thể xóa loại sân vì đã có khung giờ cố định cấu hình."));
        }

        // 6. Xóa loại sân khi thỏa mãn tất cả điều kiện
        dbContext.CourtTypes.Remove(courtType);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
