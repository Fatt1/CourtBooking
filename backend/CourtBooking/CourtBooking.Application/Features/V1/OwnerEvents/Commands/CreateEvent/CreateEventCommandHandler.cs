using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Events;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.CreateEvent;

internal sealed class CreateEventCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext,
    IBranchAuthorizationService branchAuth,
    IOrderChecker orderChecker,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<CreateEventCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateEventCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh của chủ sân
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<Guid>(authResult.Error!);
        }

        // 2. Chuẩn bị danh sách FlatSlotItem cho từng sân con của sự kiện
        var courtsInfo = await dbContext.Courts
            .AsNoTracking()
            .Where(c => request.CourtIds.Contains(c.Id))
            .Select(c => new { c.Id, c.CourtTypeId })
            .ToListAsync(cancellationToken);

        var courtTypeMap = courtsInfo.ToDictionary(c => c.Id, c => c.CourtTypeId);

        var flatSlots = request.CourtIds
            .Select(courtId => new FlatSlotItem(
                courtTypeMap.GetValueOrDefault(courtId),
                Guid.Empty,
                courtId,
                request.Date,
                request.StartTime,
                request.EndTime))
            .ToList();

        // 3. Tái sử dụng IOrderChecker để xác thực chi nhánh và giờ mở cửa (Ngoài Lock)
        var branchResult = await orderChecker.ValidateBranchAsync(request.BranchId, flatSlots, cancellationToken);
        if (branchResult.IsFailure)
        {
            return Result.Failure<Guid>(branchResult.Error!);
        }

        var branch = branchResult.Value;

        // 4. Tái sử dụng IOrderChecker để xác thực danh sách sân con và trạng thái hoạt động (Ngoài Lock)
        var courtsResult = await orderChecker.ValidateCourtsAsync(request.BranchId, flatSlots, cancellationToken);
        if (courtsResult.IsFailure)
        {
            return Result.Failure<Guid>(courtsResult.Error!);
        }

        // 5. Áp dụng Keyed Locking chuẩn của nhóm để chống tranh chấp lịch (Anti-double booking)
        var lockKeys = new HashSet<string>();
        foreach (var slot in flatSlots)
        {
            if (slot.StartTime >= slot.EndTime)
            {
                continue;
            }

            var current = slot.StartTime;
            while (current < slot.EndTime)
            {
                lockKeys.Add($"court:{slot.CourtId}:{slot.Date:yyyyMMdd}:{current:HHmm}");
                var next = current.AddMinutes(30);
                if (next <= current)
                {
                    break;
                }
                current = next;
            }
        }

        var sortedLockKeys = lockKeys.OrderBy(k => k, StringComparer.Ordinal).ToList();
        var releasers = new List<IDisposable>(sortedLockKeys.Count);

        try
        {
            foreach (var key in sortedLockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 5.1. Tái sử dụng IOrderChecker để kiểm tra xung đột lịch thực tế trong Database (Trong Lock)
            var conflictResult = await orderChecker.CheckConflictsAsync(flatSlots, cancellationToken);
            if (conflictResult.IsFailure)
            {
                return Result.Failure<Guid>(conflictResult.Error!);
            }

            // 5.2. Khởi tạo Order đặc biệt để khóa Time Grid & tạo SportEvent trong Database Transaction
            var strategy = dbContext.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    var orderId = Guid.CreateVersion7();
                    var orderCode = $"EVT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N", System.Globalization.CultureInfo.InvariantCulture)[..6].ToUpperInvariant()}";

                    var order = new Order
                    {
                        Id = orderId,
                        OrderCode = orderCode,
                        BranchId = request.BranchId,
                        PlayerId = userContext.UserId,
                        CustomerName = "Ban Tổ Chức Sự Kiện",
                        CustomerPhone = "0000000000",
                        Channel = OrderChannel.Pos,
                        OrderType = OrderType.Event,
                        Status = OrderStatus.Confirmed, // Đã xác nhận -> Khóa cứng slot sân trên ma trận Time Grid
                        HoldExpiresAt = DateTime.UtcNow.AddYears(100),
                        OrderDate = request.Date,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Note = $"Tổ chức sự kiện: {request.Title.Trim()}"
                    };

                    foreach (var courtId in request.CourtIds)
                    {
                        order.Details.Add(new OrderDetail
                        {
                            Id = Guid.CreateVersion7(),
                            OrderId = orderId,
                            CourtId = courtId,
                            Date = request.Date,
                            StartTime = request.StartTime,
                            EndTime = request.EndTime,
                            Price = 0m
                        });
                    }

                    dbContext.Orders.Add(order);

                    var sportEvent = new SportEvent
                    {
                        Id = Guid.CreateVersion7(),
                        OrderId = orderId,
                        SportTypeId = request.SportTypeId,
                        Date = request.Date,
                        StartTime = request.StartTime,
                        EndTime = request.EndTime,
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

                    dbContext.SportEvents.Add(sportEvent);

                    await dbContext.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);

                    return Result.Success(sportEvent.Id);
                }
                catch
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
            });
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
