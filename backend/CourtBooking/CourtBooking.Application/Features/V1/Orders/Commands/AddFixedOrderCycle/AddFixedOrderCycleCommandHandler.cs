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

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddFixedOrderCycle;

public sealed class AddFixedOrderCycleCommandHandler(
    IApplicationDbContext dbContext,
    IOrderChecker bookingValidator,
    IBranchAuthorizationService branchAuthorizationService,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<AddFixedOrderCycleCommand, Guid>
{
    public async Task<Result<Guid>> Handle(AddFixedOrderCycleCommand request, CancellationToken cancellationToken)
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
            return Result.Failure<Guid>(new NotFoundError("Order", request.OrderId));
        }

        if (order.OrderType != OrderType.Fixed)
        {
            return Result.Failure<Guid>(new BadError("Đơn hàng này không phải là đơn đặt lịch cố định."));
        }

        // 2. Kiểm tra quyền sở hữu chi nhánh
        var isAuthorized = await branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isAuthorized)
        {
            return Result.Failure<Guid>(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }

        // 3. Chuẩn bị danh sách tất cả các chu kì (chu kì mới + các chu kì đã có)
        var existingCourtTypeIds = order.FixedConfigs
            .SelectMany(f => f.Courts)
            .Select(c => c.Court.CourtTypeId)
            .Distinct()
            .ToList();

        var activePriceTables = existingCourtTypeIds.Count > 0
            ? await dbContext.PriceTables
                .AsNoTracking()
                .Where(pt => existingCourtTypeIds.Contains(pt.CourtTypeId) && pt.IsActive)
                .ToListAsync(cancellationToken)
            : [];

        var allCycles = new List<FixedCycleInput>();

        // Chu kì mới thêm
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

        // Các chu kì đã có
        foreach (var config in order.FixedConfigs)
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

        // 4. Xác thực và tính toán lại toàn bộ slot
        var validationResult = await bookingValidator.ValidateFixedBookingAsync(
            order.BranchId,
            allCycles,
            null,
            cancellationToken);

        if (validationResult.IsFailure)
        {
            return Result.Failure<Guid>(validationResult.Error!);
        }

        var bookingContext = validationResult.Value;

        // 5. Khóa bằng AsyncKeyedLocker để chống đặt trùng lịch
        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 5.1 Kiểm tra trùng lịch ngoại trừ chính đơn hàng này
            var conflictResult = await bookingValidator.CheckConflictsAsync(
                bookingContext.FlatSlots,
                cancellationToken,
                excludeOrderId: order.Id);

            if (conflictResult.IsFailure)
            {
                return Result.Failure<Guid>(conflictResult.Error!);
            }

            // 5.2 Khởi tạo và thêm FixedOrderConfig mới
            var newConfig = new FixedOrderConfig
            {
                Id = Guid.CreateVersion7(),
                OrderId = order.Id,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                DaysOfWeekMask = request.DaysOfWeekMask,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                ExceptionDates = FixedCycleHelper.FormatExceptionDates(request.ExceptionDates)
            };

            foreach (var courtId in request.CourtIds)
            {
                newConfig.Courts.Add(new FixedOrderConfigCourt
                {
                    FixedOrderConfigId = newConfig.Id,
                    CourtId = courtId
                });
            }

            order.AddFixedConfig(newConfig);

            // 5.3 Cập nhật lại toàn bộ OrderDetail của đơn hàng
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

            return Result<Guid>.Success(newConfig.Id);
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
