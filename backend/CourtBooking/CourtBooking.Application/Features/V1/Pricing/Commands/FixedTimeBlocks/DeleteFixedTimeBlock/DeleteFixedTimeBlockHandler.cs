using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.DeleteFixedTimeBlock;

internal sealed class DeleteFixedTimeBlockHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<DeleteFixedTimeBlockCommand>
{
    public async Task<Result> Handle(
        DeleteFixedTimeBlockCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        // 2. Tải khung giờ bắt buộc và kiểm tra thuộc chi nhánh
        var block = await dbContext.FixedTimeBlocks
            .Include(b => b.CourtType)
            .FirstOrDefaultAsync(b => b.Id == request.BlockId, cancellationToken);

        if (block is null || block.CourtType.BranchId != request.BranchId)
        {
            return Result.Failure(new NotFoundError("FixedTimeBlock", request.BlockId));
        }

        // 3. Xóa khung giờ bắt buộc (EF Core sẽ cascade delete các liên kết sân FixedTimeBlockCourts)
        dbContext.FixedTimeBlocks.Remove(block);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
