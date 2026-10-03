using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateFixedOrderCycle;

public sealed class UpdateFixedOrderCycleCommandHandler(
    IApplicationDbContext dbContext,
    IOrderChecker bookingValidator,
    IBranchAuthorizationService branchAuthorizationService,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<UpdateFixedOrderCycleCommand>
{
    public async Task<Result> Handle(UpdateFixedOrderCycleCommand request, CancellationToken cancellationToken)
    {
        // 1. Tải thông tin đơn hàng cùng các chu kì, sân liên kết và các OrderDetail hiện tại
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

        // 3. Tìm chu kì cần cập nhật
        var targetConfig = order.FixedConfigs.FirstOrDefault(f => f.Id == request.CycleId);
        if (targetConfig == null)
        {
            return Result.Failure(new NotFoundError("FixedOrderConfig", request.CycleId));
        }

        // 4. Tập hợp danh sách tất cả các chu kì của Order (chu kì đang update + các chu kì còn lại)
        var otherCourtTypeIds = order.FixedConfigs
            .Where(f => f.Id != request.CycleId)
            .SelectMany(f => f.Courts)
            .Select(c => c.Court.CourtTypeId)
            .Distinct()
            .ToList();

        var activePriceTables = otherCourtTypeIds.Count > 0
            ? await dbContext.PriceTables
                .AsNoTracking()
                .Where(pt => otherCourtTypeIds.Contains(pt.CourtTypeId) && pt.IsActive)
                .ToListAsync(cancellationToken)
            : [];

        var allCycles = new List<FixedCycleInput>();

        foreach (var config in order.FixedConfigs)
        {
            if (config.Id == request.CycleId)
            {
                allCycles.Add(new FixedCycleInput(
                    request.CourtTypeId,
                    request.PriceTableId,
                    request.StartDate,
                    request.EndDate,
                    request.DaysOfWeekMask,
                    request.StartTime,
                    request.EndTime,
                    request.CourtIds,
                    request.ExceptionDates));
            }
            else
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
        }

        // 5. Xác thực chi nhánh, giờ mở cửa, bảng giá và tính lại toàn bộ slot cho tất cả chu kì
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

        // 6. Khóa bằng AsyncKeyedLocker để chống đặt trùng lịch
        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 6.1 Kiểm tra trùng lịch ngoại trừ các slot thuộc chính đơn hàng này
            var conflictResult = await bookingValidator.CheckConflictsAsync(
                bookingContext.FlatSlots,
                cancellationToken,
                excludeOrderId: order.Id);

            if (conflictResult.IsFailure)
            {
                return Result.Failure(conflictResult.Error!);
            }

            // 6.2 Cập nhật cấu hình chu kì trong Database
            targetConfig.StartDate = request.StartDate;
            targetConfig.EndDate = request.EndDate;
            targetConfig.DaysOfWeekMask = request.DaysOfWeekMask;
            targetConfig.StartTime = request.StartTime;
            targetConfig.EndTime = request.EndTime;
            targetConfig.ExceptionDates = FixedCycleHelper.FormatExceptionDates(request.ExceptionDates);

            // Cập nhật danh sách sân của chu kì
            dbContext.FixedOrderConfigCourts.RemoveRange(targetConfig.Courts);
            targetConfig.Courts.Clear();
            foreach (var courtId in request.CourtIds)
            {
                targetConfig.Courts.Add(new FixedOrderConfigCourt
                {
                    FixedOrderConfigId = targetConfig.Id,
                    CourtId = courtId
                });
            }

            // 6.3 Xóa toàn bộ OrderDetail cũ và sinh mới dựa trên tất cả chu kì đã tính toán
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
