using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CreateFixedOrderByOwner;

public sealed class CreateFixedOrderByOwnerCommandHandler(
    IApplicationDbContext dbContext,
    IOrderChecker bookingValidator,
    IBranchAuthorizationService branchAuth,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<CreateFixedOrderByOwnerCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateFixedOrderByOwnerCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var isOwner = await branchAuth.IsOwnerAsync(request.BranchId, cancellationToken);
        if (!isOwner)
        {
            return Result.Failure<Guid>(new ForbiddenError("Bạn không phải là chủ sở hữu của chi nhánh này."));
        }

        // 2. Xác thực chi nhánh, giờ mở cửa, các sân, tự động lấy bảng giá active và tính tiền theo giá khách cố định
        var validationResult = await bookingValidator.ValidateFixedBookingAsync(
            request.BranchId,
            request.Cycles,
            request.Services,
            cancellationToken);

        if (validationResult.IsFailure)
        {
            return Result.Failure<Guid>(validationResult.Error!);
        }

        var bookingContext = validationResult.Value;

        // 3. Khóa bằng AsyncKeyedLocker để chống đặt trùng lịch
        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 3.1. Kiểm tra xung đột với các OrderDetail đã có trong DB
            var conflictResult = await bookingValidator.CheckConflictsAsync(bookingContext.FlatSlots, cancellationToken);
            if (conflictResult.IsFailure)
            {
                return Result.Failure<Guid>(conflictResult.Error!);
            }

            // 3.2. Khởi tạo đối tượng Order lịch cố định
            var order = Order.CreateFixedOrderByOwner(
                request.BranchId,
                null,
                request.CustomerName.Trim(),
                request.CustomerPhone.Trim(),
                request.Note?.Trim(),
                request.DiscountAmount);

            // 3.3. Thêm các cấu hình chu kì (FixedOrderConfig & FixedOrderConfigCourt)
            foreach (var cycle in request.Cycles)
            {
                var fixedConfig = new FixedOrderConfig
                {
                    Id = Guid.CreateVersion7(),
                    OrderId = order.Id,
                    StartDate = cycle.StartDate,
                    EndDate = cycle.EndDate,
                    DaysOfWeekMask = cycle.DaysOfWeekMask,
                    StartTime = cycle.StartTime,
                    EndTime = cycle.EndTime,
                    ExceptionDates = FixedCycleHelper.FormatExceptionDates(cycle.ExceptionDates)
                };

                foreach (var courtId in cycle.CourtIds)
                {
                    fixedConfig.Courts.Add(new FixedOrderConfigCourt
                    {
                        FixedOrderConfigId = fixedConfig.Id,
                        CourtId = courtId
                    });
                }

                order.AddFixedConfig(fixedConfig);
            }

            // 3.4. Thêm các OrderDetail đã sinh và tính tiền
            foreach (var slot in bookingContext.CalculatedSlots)
            {
                order.AddOrderDetail(
                    slot.CourtId,
                    slot.StartTime,
                    slot.EndTime,
                    slot.Price,
                    slot.Date);
            }

            // 3.5. Thêm dịch vụ đi kèm nếu có
            if (request.Services != null && request.Services.Count > 0)
            {
                foreach (var s in request.Services)
                {
                    var sb = bookingContext.ServiceBranches.First(item => item.ServiceId == s.ServiceId);
                    order.AddOrderService(s.ServiceId, sb.Price, s.Quantity);
                }
            }

            // 3.6. Ghi nhận giao dịch thanh toán
            order.AddPaymentTransaction(
                order.TotalAmount,
                request.PaymentMethod,
                null,
                PaymentTransactionType.Payment);

            dbContext.Orders.Add(order);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(order.Id);
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
