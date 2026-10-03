using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Helpers;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.CreateFixedTimeBlock;

internal sealed class CreateFixedTimeBlockHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<CreateFixedTimeBlockCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateFixedTimeBlockCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<Guid>(authResult.Error!);
        }

        // 2. Kiểm tra loại sân có tồn tại và thuộc chi nhánh hay không
        var courtTypeExists = await dbContext.CourtTypes
            .AnyAsync(ct => ct.Id == request.CourtTypeId && ct.BranchId == request.BranchId, cancellationToken);

        if (!courtTypeExists)
        {
            return Result.Failure<Guid>(new NotFoundError("CourtType", request.CourtTypeId));
        }

        // 3. Kiểm tra danh sách sân áp dụng: tất cả phải thuộc loại sân này
        var targetCourtIds = request.CourtIds.Distinct().ToList();
        var courts = await dbContext.Courts
            .Where(c => targetCourtIds.Contains(c.Id) && c.CourtTypeId == request.CourtTypeId)
            .ToListAsync(cancellationToken);

        if (courts.Count != targetCourtIds.Count)
        {
            return Result.Failure<Guid>(new BadError("Một hoặc nhiều sân đã chọn không thuộc loại sân này hoặc không tồn tại."));
        }

        // 4. Tính toán Bitmask ngày trong tuần
        var mask = DaysOfWeekMaskHelper.ComputeMask(request.DaysOfWeek);

        // 5. Kiểm tra trùng lấn khung giờ bắt buộc trên từng sân đã chọn
        var existingBlocks = await dbContext.FixedTimeBlockCourts
            .AsNoTracking()
            .Include(ftbc => ftbc.FixedTimeBlock)
            .Include(ftbc => ftbc.Court)
            .Where(ftbc => targetCourtIds.Contains(ftbc.CourtId))
            .ToListAsync(cancellationToken);

        foreach (var mapping in existingBlocks)
        {
            var block = mapping.FixedTimeBlock;
            // Kiểm tra trùng ngày trong tuần bằng phép AND bitwise
            bool daysOverlap = (block.DaysOfWeekMask & mask) != 0;

            // Kiểm tra trùng khoảng giờ
            bool timeOverlap = request.StartTime < block.EndTime && request.EndTime > block.StartTime;

            if (daysOverlap && timeOverlap)
            {
                return Result.Failure<Guid>(new ConflictError(
                    $"Sân '{mapping.Court.Name}' đã có khung giờ bắt buộc {block.StartTime:HH:mm} - {block.EndTime:HH:mm} bị trùng lấn vào các thứ đã chọn."));
            }
        }

        // 6. Khởi tạo và lưu FixedTimeBlock (Bắt buộc dùng Guid.CreateVersion7())
        var blockId = Guid.CreateVersion7();
        var newBlock = new FixedTimeBlock
        {
            Id = blockId,
            CourtTypeId = request.CourtTypeId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            DaysOfWeekMask = mask,
            Courts = targetCourtIds.Select(courtId => new FixedTimeBlockCourt
            {
                FixedTimeBlockId = blockId,
                CourtId = courtId
            }).ToList()
        };

        await dbContext.FixedTimeBlocks.AddAsync(newBlock, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(newBlock.Id);
    }
}
