using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Courts;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.CreateOrderOnline;

public sealed class CreateOrderOnlineCommandHandler(
    IApplicationDbContext dbContext,
    IPriceCalculator priceCalculator,
    IUserContext userContext,
    AsyncKeyedLocker<string> keyedLocker) : ICommandHandler<CreateOrderOnlineCommand, CreateOrderOnlineResponse>
{
    public async Task<Result<CreateOrderOnlineResponse>> Handle(
        CreateOrderOnlineCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Chuẩn bị danh sách slot làm phẳng (Flattened slots) để phục vụ kiểm tra và xử lý
        var allSlots = request.CourtSlots
            .SelectMany(group => group.Slots.Select(slot => new FlatSlotItem(
                group.CourtTypeId,
                group.PriceTableId,
                slot.CourtId,
                slot.Date,
                slot.StartTime,
                slot.EndTime)))
            .ToList();

        // 2. Validate chi nhánh & giờ mở cửa (Ngoài Lock)
        var branchResult = await ValidateBranchAsync(request.BranchId, allSlots, cancellationToken);
        if (branchResult.IsFailure)
        {
            return Result.Failure<CreateOrderOnlineResponse>(branchResult.Error!);
        }
        var branch = branchResult.Value;

        // 3. Validate danh sách sân, chi nhánh sở hữu và loại sân (Ngoài Lock)
        var courtsResult = await ValidateCourtsAsync(request.BranchId, allSlots, cancellationToken);
        if (courtsResult.IsFailure)
        {
            return Result.Failure<CreateOrderOnlineResponse>(courtsResult.Error!);
        }

        // 4. Validate các bảng giá & tính toán trước giá sân cho từng slot (Ngoài Lock)
        var priceResult = await ValidatePriceTablesAndCalculatePricesAsync(request.CourtSlots, cancellationToken);
        if (priceResult.IsFailure)
        {
            return Result.Failure<CreateOrderOnlineResponse>(priceResult.Error!);
        }
        var calculatedSlots = priceResult.Value;

        // 5. Validate dịch vụ đính kèm & lấy đơn giá tại chi nhánh (Ngoài Lock)
        var servicesResult = await ValidateServicesAsync(request.BranchId, request.Services, cancellationToken);
        if (servicesResult.IsFailure)
        {
            return Result.Failure<CreateOrderOnlineResponse>(servicesResult.Error!);
        }
        var serviceBranches = servicesResult.Value;

        // ── 6. KHU VỰC ĐỒNG BỘ (CRITICAL SECTION BẢO VỆ BỞI KEYED LOCK) ──
        // Chỉ acquire lock khi tất cả thông tin đầu vào đã hợp lệ và sẵn sàng kiểm tra conflict + lưu đơn
        var lockKeys = allSlots
            .Select(s => $"court:{s.CourtId}:{s.Date:yyyyMMdd}")
            .Distinct()
            .OrderBy(k => k, StringComparer.Ordinal)
            .ToList();

        var releasers = new List<IDisposable>(lockKeys.Count);

        try
        {
            foreach (var key in lockKeys)
            {
                releasers.Add(await keyedLocker.LockAsync(key, cancellationToken));
            }

            // 6.1 Kiểm tra trùng lịch / giữ chỗ trong DB
            var conflictResult = await CheckConflictsAsync(allSlots, cancellationToken);
            if (conflictResult.IsFailure)
            {
                return Result.Failure<CreateOrderOnlineResponse>(conflictResult.Error!);
            }

            // 6.2 Khởi tạo Order và thêm các chi tiết đã tính toán sẵn
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

            foreach (var slot in calculatedSlots)
            {
                order.AddOrderDetail(
                    slot.CourtId,
                    slot.StartTime,
                    slot.EndTime,
                    slot.Price,
                    slot.Date);
            }

            if (request.Services != null)
            {
                foreach (var serviceItem in request.Services)
                {
                    var serviceBranch = serviceBranches.First(sb => sb.ServiceId == serviceItem.ServiceId);
                    order.AddOrderService(
                        serviceItem.ServiceId,
                        serviceBranch.Price,
                        serviceItem.Quantity);
                }
            }

            // 6.3 Lưu vào Database
            await dbContext.Orders.AddAsync(order, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            // 6.4 Trả về kết quả
            return Result<CreateOrderOnlineResponse>.Success(
                new CreateOrderOnlineResponse(
                    branch.QrImage?.StorageKey ?? string.Empty,
                    order.Id,
                    order.OrderCode,
                    order.TotalAmount,
                    order.HoldExpiresAt));
        }
        finally
        {
            // Luôn giải phóng tất cả các lock theo thứ tự ngược lại
            for (int i = releasers.Count - 1; i >= 0; i--)
            {
                releasers[i].Dispose();
            }
        }
    }

    #region Private Validation & Helper Methods

    /// <summary>
    /// Kiểm tra chi nhánh tồn tại, đang hoạt động và khung giờ đặt nằm trong giờ mở cửa.
    /// </summary>
    private async Task<Result<Branch>> ValidateBranchAsync(
        Guid branchId,
        List<FlatSlotItem> allSlots,
        CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches
            .AsNoTracking()
            .Include(b => b.QrImage)
            .FirstOrDefaultAsync(b => b.Id == branchId, cancellationToken);

        if (branch == null)
        {
            return Result.Failure<Branch>(new NotFoundError("Branch", branchId));
        }

        if (!branch.IsActive)
        {
            return Result.Failure<Branch>(new BadError("Chi nhánh này hiện đang tạm ngưng hoạt động."));
        }

        if (branch.CloseTime > branch.OpenTime)
        {
            foreach (var slot in allSlots)
            {
                if (slot.StartTime < branch.OpenTime || slot.EndTime > branch.CloseTime)
                {
                    return Result.Failure<Branch>(
                        new BadError($"Khung giờ đặt {slot.StartTime:HH:mm} - {slot.EndTime:HH:mm} ngày {slot.Date:dd/MM/yyyy} nằm ngoài giờ mở cửa của chi nhánh ({branch.OpenTime:HH:mm} - {branch.CloseTime:HH:mm})."));
                }
            }
        }

        return Result<Branch>.Success(branch);
    }

    /// <summary>
    /// Kiểm tra danh sách sân tồn tại, thuộc chi nhánh, đúng loại sân và đang khả dụng (Available).
    /// </summary>
    private async Task<Result<List<Court>>> ValidateCourtsAsync(
        Guid branchId,
        List<FlatSlotItem> allSlots,
        CancellationToken cancellationToken)
    {
        var courtIds = allSlots.Select(s => s.CourtId).Distinct().ToList();
        var courts = await dbContext.Courts
            .AsNoTracking()
            .Include(c => c.CourtType)
            .Where(c => courtIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        if (courts.Count != courtIds.Count)
        {
            var missingCourtId = courtIds.First(id => courts.All(c => c.Id != id));
            return Result.Failure<List<Court>>(new NotFoundError("Court", missingCourtId));
        }

        foreach (var court in courts)
        {
            if (court.CourtType.BranchId != branchId)
            {
                return Result.Failure<List<Court>>(
                    new BadError($"Sân '{court.Name}' không thuộc chi nhánh đã chọn."));
            }

            if (court.Status != CourtStatus.Available)
            {
                return Result.Failure<List<Court>>(
                    new BadError($"Sân '{court.Name}' hiện đang không khả dụng để đặt (bảo trì hoặc tạm ngưng)."));
            }
        }

        foreach (var slot in allSlots)
        {
            var court = courts.First(c => c.Id == slot.CourtId);
            if (court.CourtTypeId != slot.CourtTypeId)
            {
                return Result.Failure<List<Court>>(
                    new BadError($"Sân '{court.Name}' không thuộc loại sân đã chọn."));
            }
        }

        return Result<List<Court>>.Success(courts);
    }

    /// <summary>
    /// Kiểm tra các bảng giá hợp lệ, đang kích hoạt, khớp loại sân và tính giá trước cho từng slot.
    /// </summary>
    private async Task<Result<List<CalculatedSlotItem>>> ValidatePriceTablesAndCalculatePricesAsync(
        List<CourtBookingSlotDto> courtSlots,
        CancellationToken cancellationToken)
    {
        var priceTableIds = courtSlots.Select(g => g.PriceTableId).Distinct().ToList();
        var priceTables = await dbContext.PriceTables
            .AsNoTracking()
            .Include(pt => pt.Rules)
            .Where(pt => priceTableIds.Contains(pt.Id))
            .ToListAsync(cancellationToken);

        if (priceTables.Count != priceTableIds.Count)
        {
            var missingPtId = priceTableIds.First(id => priceTables.All(pt => pt.Id != id));
            return Result.Failure<List<CalculatedSlotItem>>(new NotFoundError("PriceTable", missingPtId));
        }

        var calculatedSlots = new List<CalculatedSlotItem>();

        foreach (var group in courtSlots)
        {
            var priceTable = priceTables.First(pt => pt.Id == group.PriceTableId);

            if (!priceTable.IsActive)
            {
                return Result.Failure<List<CalculatedSlotItem>>(
                    new BadError($"Bảng giá '{priceTable.Name}' hiện đang không hoạt động."));
            }

            if (priceTable.CourtTypeId != group.CourtTypeId)
            {
                return Result.Failure<List<CalculatedSlotItem>>(
                    new BadError($"Bảng giá '{priceTable.Name}' không áp dụng cho loại sân đã chọn."));
            }

            foreach (var slot in group.Slots)
            {
                var price = priceCalculator.CalculatePrice(
                    priceTable,
                    slot.Date,
                    slot.StartTime,
                    slot.EndTime,
                    isFixedCustomer: false);

                calculatedSlots.Add(new CalculatedSlotItem(slot.CourtId, slot.StartTime, slot.EndTime, price, slot.Date));
            }
        }

        return Result<List<CalculatedSlotItem>>.Success(calculatedSlots);
    }

    /// <summary>
    /// Kiểm tra dịch vụ tồn tại và đang kinh doanh tại chi nhánh.
    /// </summary>
    private async Task<Result<List<ServiceBranch>>> ValidateServicesAsync(
        Guid branchId,
        List<OrderServiceItemDto>? services,
        CancellationToken cancellationToken)
    {
        if (services == null || services.Count == 0)
        {
            return Result.Success(new List<ServiceBranch>());
        }

        var serviceIds = services.Select(s => s.ServiceId).Distinct().ToList();
        var serviceBranches = await dbContext.ServiceBranches
            .AsNoTracking()
            .Include(sb => sb.Service)
            .Where(sb => sb.BranchId == branchId && serviceIds.Contains(sb.ServiceId))
            .ToListAsync(cancellationToken);

        if (serviceBranches.Count != serviceIds.Count)
        {
            var missingServiceId = serviceIds.First(id => serviceBranches.All(sb => sb.ServiceId != id));
            return Result.Failure<List<ServiceBranch>>(new NotFoundError("Service", missingServiceId));
        }

        var inactiveService = serviceBranches.FirstOrDefault(sb => !sb.IsActive);
        if (inactiveService != null)
        {
            return Result.Failure<List<ServiceBranch>>(
                new BadError($"Dịch vụ '{inactiveService.Service.Name}' hiện đang tạm ngưng phục vụ tại chi nhánh này."));
        }

        return Result<List<ServiceBranch>>.Success(serviceBranches);
    }

    /// <summary>
    /// Kiểm tra trùng lịch hoặc giữ chỗ còn hiệu lực trong database (thực thi bên trong Lock).
    /// </summary>
    private async Task<Result> CheckConflictsAsync(
        List<FlatSlotItem> allSlots,
        CancellationToken cancellationToken)
    {
        var nowUtc = DateTime.UtcNow;
        var courtIds = allSlots.Select(s => s.CourtId).Distinct().ToList();
        var dates = allSlots.Select(s => s.Date).Distinct().ToList();

        var existingOccupiedSlots = await dbContext.OrderDetails
            .AsNoTracking()
            .Where(od => courtIds.Contains(od.CourtId)
                      && dates.Contains(od.Date)
                      && od.Order.Status != OrderStatus.Cancelled
                      && (od.Order.Status != OrderStatus.AwaitingPayment || od.Order.HoldExpiresAt > nowUtc))
            .Select(od => new
            {
                od.CourtId,
                od.Date,
                od.StartTime,
                od.EndTime,
                CourtName = od.Court.Name
            })
            .ToListAsync(cancellationToken);

        foreach (var slot in allSlots)
        {
            var conflict = existingOccupiedSlots.FirstOrDefault(cs =>
                cs.CourtId == slot.CourtId
                && cs.Date == slot.Date
                && slot.StartTime < cs.EndTime
                && slot.EndTime > cs.StartTime);

            if (conflict != null)
            {
                return Result.Failure(
                    new ConflictError($"Sân '{conflict.CourtName}' vào khung giờ {slot.StartTime:HH:mm} - {slot.EndTime:HH:mm} ngày {slot.Date:dd/MM/yyyy} đã có người đặt hoặc đang giữ chỗ."));
            }
        }

        return Result.Success();
    }

    #endregion

    #region Internal Helper Records

    private sealed record FlatSlotItem(
        Guid CourtTypeId,
        Guid PriceTableId,
        Guid CourtId,
        DateOnly Date,
        TimeOnly StartTime,
        TimeOnly EndTime);

    private sealed record CalculatedSlotItem(
        Guid CourtId,
        TimeOnly StartTime,
        TimeOnly EndTime,
        decimal Price,
        DateOnly Date);

    #endregion
}
