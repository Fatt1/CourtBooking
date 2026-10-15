using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddOrderSlots;

public sealed class AddOrderSlotsCommandHandler(
    IApplicationDbContext dbContext,
    IOrderChecker bookingValidator,
    IBranchAuthorizationService branchAuth,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<AddOrderSlotsCommand>
{
    public async Task<Result> Handle(AddOrderSlotsCommand request, CancellationToken cancellationToken)
    {
        // 1. Tải thông tin đơn hàng cùng các OrderDetail hiện tại
        var order = await dbContext.Orders
            .Include(o => o.Details)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));
        }

        // 2. Kiểm tra quyền sở hữu chi nhánh
        var isOwner = await branchAuth.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isOwner)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }

        // 3. Kiểm tra trạng thái đơn hàng
        if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Completed)
        {
            return Result.Failure(new BadError("Không thể thêm ca sân cho đơn hàng đã hoàn thành hoặc đã hủy."));
        }

        // 4. Xác thực chi nhánh, sân và tính giá (dùng giá khách cố định nếu là OrderType.Fixed)
        var validationResult = await bookingValidator.ValidateBookingAsync(
            order.BranchId,
            request.CourtSlots,
            null,
            isFixedCustomer: order.OrderType == OrderType.Fixed,
            cancellationToken);

        if (validationResult.IsFailure)
        {
            return Result.Failure(validationResult.Error!);
        }

        var bookingContext = validationResult.Value;

        // 5. Keyed Locking để chống trùng lịch
        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 5.1. Kiểm tra xung đột lịch thực tế (kể cả với các ca đã có trong hệ thống)
            var conflictResult = await bookingValidator.CheckConflictsAsync(bookingContext.FlatSlots, cancellationToken);
            if (conflictResult.IsFailure)
            {
                return Result.Failure(conflictResult.Error!);
            }

            // 5.2. Bổ sung các OrderDetail mới vào đơn hàng
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
