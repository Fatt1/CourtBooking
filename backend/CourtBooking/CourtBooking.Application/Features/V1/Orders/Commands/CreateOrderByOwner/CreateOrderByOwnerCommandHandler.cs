using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Payments;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderByOwner;

public sealed class CreateOrderByOwnerCommandHandler(
    IApplicationDbContext dbContext,
    IOrderChecker bookingValidator,
    IBranchAuthorizationService branchAuth,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<CreateOrderByOwnerCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateOrderByOwnerCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh của chủ sân / quản lý
        var isOwner = await branchAuth.IsOwnerAsync(request.BranchId, cancellationToken);
        if (!isOwner)
        {
            return Result.Failure<Guid>(new BadError("Bạn không phải là chủ sở hữu của chi nhánh này."));
        }

        // 2. Xác thực chi nhánh, giờ mở cửa, sân, bảng giá và dịch vụ (Ngoài Lock)
        var validationResult = await bookingValidator.ValidateBookingAsync(
            request.BranchId,
            request.CourtSlots,
            request.Services,
            isFixedCustomer: false,
            cancellationToken);

        if (validationResult.IsFailure)
        {
            return Result.Failure<Guid>(validationResult.Error!);
        }


        var bookingContext = validationResult.Value;

        // 4. Keyed Locking để chống trùng lịch (Anti-double booking)
        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 4.1. Kiểm tra xung đột lịch thực tế trong Database
            var conflictResult = await bookingValidator.CheckConflictsAsync(bookingContext.FlatSlots, cancellationToken);
            if (conflictResult.IsFailure)
            {
                return Result.Failure<Guid>(conflictResult.Error!);
            }

            // 4.2. Khởi tạo đối tượng Order kênh POS / Trực tiếp với trạng thái Confirmed
            var order = Order.CreateOrderByOwner(
                request.BranchId,
                request.PlayerId,
                request.CustomerName.Trim(),
                request.CustomerPhone.Trim(),
                request.Note?.Trim(),
                request.DiscountAmount);

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

            var paymentTransation = new PaymentTransaction
            {
                Amount = order.TotalAmount,
                CreatedAt = DateTime.UtcNow,
                Id = Guid.CreateVersion7(),
                Method = request.PaymentMethod,
                OrderId = order.Id,
                ProofImageId = null,
                Type = Domain.Enums.PaymentTransactionType.Payment
            };
            dbContext.PaymentTransactions.Add(paymentTransation);
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
