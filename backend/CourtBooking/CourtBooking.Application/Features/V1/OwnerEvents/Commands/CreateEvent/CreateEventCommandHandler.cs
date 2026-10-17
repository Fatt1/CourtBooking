using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Events;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.CreateEvent;

internal sealed class CreateEventCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth,
    IOrderChecker bookingValidator,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<CreateEventCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateEventCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh của chủ sân / quản lý
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<Guid>(authResult.Error!);
        }

        // 2. Xác thực chi nhánh, giờ mở cửa, sân, bảng giá thông qua IOrderChecker (Ngoài Lock)
        var validationResult = await bookingValidator.ValidateBookingAsync(
            request.BranchId,
            request.CourtSlots,
            services: null,
            isFixedCustomer: false,
            cancellationToken);

        if (validationResult.IsFailure)
        {
            return Result.Failure<Guid>(validationResult.Error!);
        }

        var bookingContext = validationResult.Value;

        // 3. Keyed Locking để chống trùng lịch (Anti-double booking)
        var lockKeys = bookingContext.GetLockKeys();
        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 3.1. Kiểm tra xung đột lịch thực tế trong Database
            var conflictResult = await bookingValidator.CheckConflictsAsync(bookingContext.FlatSlots, cancellationToken);
            if (conflictResult.IsFailure)
            {
                return Result.Failure<Guid>(conflictResult.Error!);
            }

            // 3.2. Khởi tạo đối tượng Order kênh POS / Sự kiện với trạng thái Confirmed (Khóa cứng slot trên Time Grid)
            var customerName = !string.IsNullOrWhiteSpace(request.CustomerName)
                ? request.CustomerName.Trim()
                : "Ban Tổ Chức Sự Kiện";

            var customerPhone = !string.IsNullOrWhiteSpace(request.CustomerPhone)
                ? request.CustomerPhone.Trim()
                : "0000000000";

            var note = !string.IsNullOrWhiteSpace(request.Note)
                ? request.Note.Trim()
                : $"Tổ chức sự kiện: {request.Title.Trim()}";

            var order = Order.CreateEventOrder(
                request.BranchId,
                request.Date,
                customerName,
                customerPhone,
                note);

            foreach (var slot in bookingContext.CalculatedSlots)
            {
                order.AddOrderDetail(
                    slot.CourtId,
                    slot.StartTime,
                    slot.EndTime,
                    slot.Price,
                    slot.Date);
            }

            // 3.3. Khởi tạo đối tượng SportEvent liên kết với Order
            var sportEvent = new SportEvent
            {
                Id = Guid.CreateVersion7(),
                OrderId = order.Id,
                SportTypeId = request.SportTypeId,
                Title = request.Title.Trim(),
                SkillLevelFrom = string.IsNullOrWhiteSpace(request.SkillLevelFrom) ? null : request.SkillLevelFrom.Trim(),
                SkillLevelTo = string.IsNullOrWhiteSpace(request.SkillLevelTo) ? null : request.SkillLevelTo.Trim(),
                TicketPrice = request.TicketPrice,
                Slots = request.Slots,
                AvailableSlot = request.Slots,
                Status = EventStatus.Open,
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Orders.Add(order);
            dbContext.SportEvents.Add(sportEvent);

            await dbContext.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(sportEvent.Id);
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

