using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.DeleteFixedOrderCycle;

public sealed class DeleteFixedOrderCycleCommandHandler(
    IApplicationDbContext dbContext,
    IOrderChecker bookingValidator,
    IBranchAuthorizationService branchAuthorizationService,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<DeleteFixedOrderCycleCommand>
{
    public async Task<Result> Handle(DeleteFixedOrderCycleCommand request, CancellationToken cancellationToken)
    {
        // 1. Tải thông tin đơn hàng cùng các chu kì và OrderDetail hiện tại
        var order = await dbContext.Orders
            .Include(o => o.FixedConfigs)
                .ThenInclude(f => f.Courts)
                    .ThenInclude(c => c.Court)
            .Include(o => o.Details)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));
        }

        if (order.OrderType != OrderType.Fixed)
        {
            return Result.Failure(new BadError("Đơn hàng này không phải là đơn đặt lịch cố định."));
        }

        // 2. Kiểm tra quyền sở hữu chi nhánh
        var isAuthorized = await branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isAuthorized)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }

        // 3. Tìm chu kì cần xóa
        var targetCycle = order.FixedConfigs.FirstOrDefault(f => f.Id == request.CycleId);
        if (targetCycle == null)
        {
            return Result.Failure(new NotFoundError("FixedOrderConfig", request.CycleId));
        }

        if (order.FixedConfigs.Count <= 1)
        {
            return Result.Failure(new BadError("Không thể xóa chu kì duy nhất của đơn hàng. Nếu không tiếp tục sử dụng, vui lòng hủy toàn bộ đơn hàng."));
        }

        // 4. Chuẩn bị danh sách các chu kì còn lại
        var remainingConfigs = order.FixedConfigs.Where(f => f.Id != request.CycleId).ToList();

        var remainingCourtTypeIds = remainingConfigs
            .SelectMany(f => f.Courts)
            .Select(c => c.Court.CourtTypeId)
            .Distinct()
            .ToList();

        var activePriceTables = remainingCourtTypeIds.Count > 0
            ? await dbContext.PriceTables
                .AsNoTracking()
                .Where(pt => remainingCourtTypeIds.Contains(pt.CourtTypeId) && pt.IsActive)
                .ToListAsync(cancellationToken)
            : [];

        var allCycles = new List<FixedCycleInput>();

        foreach (var config in remainingConfigs)
        {
            var courtTypeId = config.Courts.FirstOrDefault()?.Court?.CourtTypeId ?? Guid.Empty;
            var priceTableId = activePriceTables.FirstOrDefault(pt => pt.CourtTypeId == courtTypeId)?.Id ?? Guid.Empty;

            allCycles.Add(new FixedCycleInput(
                courtTypeId,
                priceTableId,
                config.StartDate,
                config.EndDate,
                config.DaysOfWeekMask,
                config.StartTime,
                config.EndTime,
                config.Courts.Select(c => c.CourtId).ToList(),
                FixedCycleHelper.ParseExceptionDates(config.ExceptionDates)));
        }

        // 5. Xác thực và tính toán lại toàn bộ slot cho các chu kì còn lại
        var validationResult = await bookingValidator.ValidateFixedBookingAsync(
            order.BranchId,
            allCycles,
            null,
            cancellationToken);

        if (validationResult.IsFailure)
        {
            return Result.Failure(validationResult.Error!);
        }

        var bookingContext = validationResult.Value;

        // 6. Khóa bằng AsyncKeyedLocker
        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 6.1 Xóa chu kì chỉ định
            dbContext.FixedOrderConfigs.Remove(targetCycle);
            order.FixedConfigs.Remove(targetCycle);

            // 6.2 Cập nhật lại toàn bộ OrderDetail của đơn hàng
            dbContext.OrderDetails.RemoveRange(order.Details);
            order.ClearOrderDetails();

            foreach (var slot in bookingContext.CalculatedSlots)
            {
                order.AddOrderDetail(
                    slot.CourtId,
                    slot.StartTime,
                    slot.EndTime,
                    slot.Price,
                    slot.Date);
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Result.Success();
        }
        finally
        {
            for (int i = releasers.Count - 1; i >= 0; i--)
            {
                releasers[i].Dispose();
            }
        }
    }
}
