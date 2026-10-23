using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Helpers;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.UpdateFixedTimeBlock;

internal sealed class UpdateFixedTimeBlockHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<UpdateFixedTimeBlockCommand>
{
    public async Task<Result> Handle(
        UpdateFixedTimeBlockCommand request,
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

        // 3. Kiểm tra danh sách sân áp dụng: tất cả phải thuộc cùng CourtType với block này
        var targetCourtIds = request.CourtIds.Distinct().ToList();
        var courts = await dbContext.Courts
            .Where(c => targetCourtIds.Contains(c.Id) && c.CourtTypeId == block.CourtTypeId)
            .ToListAsync(cancellationToken);

        if (courts.Count != targetCourtIds.Count)
        {
            return Result.Failure(new BadError("Một hoặc nhiều sân đã chọn không thuộc loại sân này hoặc không tồn tại."));
        }

        // 4. Tính toán Bitmask ngày trong tuần
        var mask = DaysOfWeekMaskHelper.ComputeMask(request.DaysOfWeek);

        // 5. Kiểm tra trùng lấn khung giờ bắt buộc trên từng sân đã chọn (loại trừ chính block đang cập nhật)
        var existingBlocks = await dbContext.FixedTimeBlockCourts
            .AsNoTracking()
            .Include(ftbc => ftbc.FixedTimeBlock)
            .Include(ftbc => ftbc.Court)
            .Where(ftbc => targetCourtIds.Contains(ftbc.CourtId) && ftbc.FixedTimeBlockId != request.BlockId)
            .ToListAsync(cancellationToken);

        foreach (var mapping in existingBlocks)
        {
            var otherBlock = mapping.FixedTimeBlock;
            bool daysOverlap = (otherBlock.DaysOfWeekMask & mask) != 0;
            bool timeOverlap = request.StartTime < otherBlock.EndTime && request.EndTime > otherBlock.StartTime;

            if (daysOverlap && timeOverlap)
            {
                return Result.Failure(new ConflictError(
                    $"Sân '{mapping.Court.Name}' đã có khung giờ bắt buộc {otherBlock.StartTime:HH:mm} - {otherBlock.EndTime:HH:mm} bị trùng lấn vào các thứ đã chọn."));
            }
        }

        // 6. Cập nhật thông tin khung giờ
        block.StartTime = request.StartTime;
        block.EndTime = request.EndTime;
        block.DaysOfWeekMask = mask;
        block.UpdatedAt = DateTime.UtcNow;

        // 7. Cập nhật liên kết sân (FixedTimeBlockCourts)
        var existingCourts = await dbContext.FixedTimeBlockCourts
            .Where(c => c.FixedTimeBlockId == block.Id)
            .ToListAsync(cancellationToken);

        var toRemove = existingCourts.Where(c => !targetCourtIds.Contains(c.CourtId)).ToList();
        if (toRemove.Count > 0)
        {
            dbContext.FixedTimeBlockCourts.RemoveRange(toRemove);
        }

        var existingCourtIds = existingCourts.Select(c => c.CourtId).ToHashSet();
        var toAdd = targetCourtIds
            .Where(id => !existingCourtIds.Contains(id))
            .Select(id => new FixedTimeBlockCourt
            {
                FixedTimeBlockId = block.Id,
                CourtId = id
            })
            .ToList();

        if (toAdd.Count > 0)
        {
            await dbContext.FixedTimeBlockCourts.AddRangeAsync(toAdd, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
