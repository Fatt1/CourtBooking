using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderOnline;

public sealed class CreateOrderOnlineCommandHandler(
    IApplicationDbContext dbContext,
    IOrderChecker bookingValidator,
    IUserContext userContext,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<CreateOrderOnlineCommand, CreateOrderOnlineResponse>
{
    public async Task<Result<CreateOrderOnlineResponse>> Handle(
        CreateOrderOnlineCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Xác thực chi nhánh, giờ mở cửa, sân, bảng giá và dịch vụ (Ngoài Lock)
        var validationResult = await bookingValidator.ValidateBookingAsync(
            request.BranchId,
            request.CourtSlots,
            request.Services,
            isFixedCustomer: false,
            cancellationToken);

        if (validationResult.IsFailure)
        {
            return Result.Failure<CreateOrderOnlineResponse>(validationResult.Error!);
        }

        var bookingContext = validationResult.Value;

        // 2. Chống đặt trùng lịch (Anti-double booking) bằng Keyed Locker
        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 2.1 Kiểm tra trùng lịch / giữ chỗ trong DB
            var conflictResult = await bookingValidator.CheckConflictsAsync(bookingContext.FlatSlots, cancellationToken);
            if (conflictResult.IsFailure)
            {
                return Result.Failure<CreateOrderOnlineResponse>(conflictResult.Error!);
            }

            // 2.2 Khởi tạo Order và thêm các chi tiết đã tính toán sẵn
            var playerId = request.PlayerId;
            if (!playerId.HasValue && userContext.IsAuthenticated && userContext.UserId != Guid.Empty)
            {
                playerId = userContext.UserId;
            }

            var order = Order.CreateOrderOnline(
                request.BranchId,
                playerId,
                request.CustomerName.Trim(),
                request.CustomerPhone.Trim(),
                request.Note?.Trim());

            foreach (var slot in bookingContext.CalculatedSlots)
            {
                order.AddOrderDetail(
                    slot.CourtId,
                    slot.StartTime,
                    slot.EndTime,
                    slot.Price,
                    slot.Date);
            }

            if (request.Services != null && request.Services.Count > 0)
            {
                foreach (var s in request.Services)
                {
                    var sb = bookingContext.ServiceBranches.First(item => item.ServiceId == s.ServiceId);
                    order.AddOrderService(s.ServiceId, sb.Price, s.Quantity);
                }
            }

            dbContext.Orders.Add(order);
            await dbContext.SaveChangesAsync(cancellationToken);

            var qrCodeImageKey = bookingContext.Branch.QrImage?.StorageKey ?? string.Empty;

            return Result<CreateOrderOnlineResponse>.Success(new CreateOrderOnlineResponse(
                qrCodeImageKey,
                order.Id,
                order.OrderCode,
                order.TotalAmount,
                order.HoldExpiresAt));
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
