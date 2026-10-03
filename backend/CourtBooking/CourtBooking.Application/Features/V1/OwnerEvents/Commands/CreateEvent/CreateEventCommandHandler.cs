using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
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
    IBranchAuthorizationService branchAuth) : ICommandHandler<CreateEventCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateEventCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<Guid>(authResult.Error!);
        }

        // 2. Kiểm tra chi nhánh và giờ mở cửa
        var branch = await dbContext.Branches
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BranchId, cancellationToken);

        if (branch is null)
        {
            return Result.Failure<Guid>(new NotFoundError("Branch", request.BranchId));
        }

        if (!branch.IsActive)
        {
            return Result.Failure<Guid>(new BadError("Chi nhánh này hiện đang tạm ngưng hoạt động."));
        }

        if (branch.CloseTime > branch.OpenTime && (request.StartTime < branch.OpenTime || request.EndTime > branch.CloseTime))
        {
            return Result.Failure<Guid>(new BadError(
                $"Khung giờ sự kiện ({request.StartTime:HH:mm} - {request.EndTime:HH:mm}) nằm ngoài giờ mở cửa của chi nhánh ({branch.OpenTime:HH:mm} - {branch.CloseTime:HH:mm})."));
        }

        if (branch.SportTypeId != request.SportTypeId)
        {
            return Result.Failure<Guid>(new BadError("Chi nhánh này không hỗ trợ môn thể thao đã chọn cho sự kiện."));
        }

        // 3. Kiểm tra tính hợp lệ của các sân con
        var courts = await dbContext.Courts
            .AsNoTracking()
            .Include(c => c.CourtType)
            .Where(c => request.CourtIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        if (courts.Count != request.CourtIds.Count)
        {
            var missingCourtId = request.CourtIds.First(id => courts.All(c => c.Id != id));
            return Result.Failure<Guid>(new NotFoundError("Court", missingCourtId));
        }

        foreach (var court in courts)
        {
            if (court.CourtType.BranchId != request.BranchId)
            {
                return Result.Failure<Guid>(new BadError($"Sân '{court.Name}' không thuộc chi nhánh đã chọn."));
            }

            if (court.Status != CourtStatus.Available)
            {
                return Result.Failure<Guid>(new BadError($"Sân '{court.Name}' hiện không khả dụng (bảo trì hoặc tạm ngưng)."));
            }
        }

        // 4. KIỂM TRA TRÙNG LỊCH TRÊN MA TRẬN TIME GRID (Anti-conflict booking)
        var nowUtc = DateTime.UtcNow;
        var conflictingSlots = await dbContext.OrderDetails
            .AsNoTracking()
            .Where(od => request.CourtIds.Contains(od.CourtId)
                      && od.Date == request.Date
                      && request.StartTime < od.EndTime
                      && request.EndTime > od.StartTime
                      && od.Order.Status != OrderStatus.Cancelled
                      && (od.Order.Status != OrderStatus.AwaitingPayment || od.Order.HoldExpiresAt > nowUtc))
            .Select(od => new
            {
                CourtName = od.Court.Name,
                od.StartTime,
                od.EndTime
            })
            .ToListAsync(cancellationToken);

        if (conflictingSlots.Count != 0)
        {
            var firstConflict = conflictingSlots[0];
            return Result.Failure<Guid>(new ConflictError(
                $"Sân '{firstConflict.CourtName}' trong khung giờ {firstConflict.StartTime:HH:mm} - {firstConflict.EndTime:HH:mm} ngày {request.Date:dd/MM/yyyy} đã có lịch đặt hoặc đang diễn ra sự kiện khác."));
        }

        // 5. KHỞI TẠO ORDER ĐẶC BIỆT ĐỂ KHÓA TIME GRID & TẠO SPORTEVENT TRONG TRANSACTION
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
}
