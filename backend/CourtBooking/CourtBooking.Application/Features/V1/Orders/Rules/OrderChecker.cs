using CourtBooking.Application.Abstractions.Courts;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Common;

/// <summary>
/// Triển khai service dùng chung xử lý việc thẩm định dữ liệu đặt sân và kiểm tra trùng lịch.
/// </summary>
public sealed class OrderChecker(
    IApplicationDbContext dbContext,
    IPriceCalculator priceCalculator) : IOrderChecker
{
    public List<FlatSlotItem> FlattenSlots(List<CourtBookingSlot> courtSlots)
    {
        return courtSlots
            .SelectMany(group => group.Slots.Select(slot => new FlatSlotItem(
                group.CourtTypeId,
                group.PriceTableId,
                slot.CourtId,
                slot.Date,
                slot.StartTime,
                slot.EndTime)))
            .ToList();
    }

    public async Task<Result<BookingValidationContext>> ValidateBookingAsync(
        Guid branchId,
        List<CourtBookingSlot> courtSlots,
        List<OrderServiceItem>? services,
        bool isFixedCustomer,
        CancellationToken cancellationToken)
    {
        var allSlots = FlattenSlots(courtSlots);

        // 1. Validate chi nhánh & giờ mở cửa
        var branchResult = await ValidateBranchAsync(branchId, allSlots, cancellationToken);
        if (branchResult.IsFailure)
        {
            return Result.Failure<BookingValidationContext>(branchResult.Error!);
        }

        // 2. Validate danh sách sân
        var courtsResult = await ValidateCourtsAsync(branchId, allSlots, cancellationToken);
        if (courtsResult.IsFailure)
        {
            return Result.Failure<BookingValidationContext>(courtsResult.Error!);
        }

        // 3. Validate bảng giá và tính giá
        var calculatedSlotsResult = await ValidatePriceTablesAndCalculatePricesAsync(
            courtSlots,
            isFixedCustomer,
            cancellationToken);
        if (calculatedSlotsResult.IsFailure)
        {
            return Result.Failure<BookingValidationContext>(calculatedSlotsResult.Error!);
        }

        // 4. Validate dịch vụ
        var servicesResult = await ValidateServicesAsync(branchId, services, cancellationToken);
        if (servicesResult.IsFailure)
        {
            return Result.Failure<BookingValidationContext>(servicesResult.Error!);
        }

        return Result<BookingValidationContext>.Success(new BookingValidationContext(
            branchResult.Value,
            courtsResult.Value,
            calculatedSlotsResult.Value,
            servicesResult.Value,
            allSlots));
    }

    public async Task<Result<Branch>> ValidateBranchAsync(
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

    public async Task<Result<List<Court>>> ValidateCourtsAsync(
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

    public async Task<Result<List<CalculatedSlotItem>>> ValidatePriceTablesAndCalculatePricesAsync(
        List<CourtBookingSlot> courtSlots,
        bool isFixedCustomer,
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
                    isFixedCustomer);

                calculatedSlots.Add(new CalculatedSlotItem(slot.CourtId, slot.StartTime, slot.EndTime, price, slot.Date));
            }
        }

        return Result<List<CalculatedSlotItem>>.Success(calculatedSlots);
    }

    public async Task<Result<List<ServiceBranch>>> ValidateServicesAsync(
        Guid branchId,
        List<OrderServiceItem>? services,
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

    public async Task<Result<BookingValidationContext>> ValidateFixedBookingAsync(
        Guid branchId,
        List<FixedCycleInput> cycles,
        List<OrderServiceItem>? services,
        CancellationToken cancellationToken)
    {
        if (cycles == null || cycles.Count == 0)
        {
            return Result.Failure<BookingValidationContext>(new BadError("Đơn đặt cố định phải có ít nhất một chu kì."));
        }

        // 1. Kiểm tra chi nhánh
        var branch = await dbContext.Branches
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == branchId, cancellationToken);

        if (branch == null)
        {
            return Result.Failure<BookingValidationContext>(new NotFoundError("Branch", branchId));
        }

        if (!branch.IsActive)
        {
            return Result.Failure<BookingValidationContext>(new BadError("Chi nhánh này hiện đang tạm ngưng hoạt động."));
        }

        // 2. Kiểm tra giờ mở cửa của từng chu kì và sinh slot
        var allGeneratedSlots = new List<(Guid CourtTypeId, Guid PriceTableId, Guid CourtId, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime)>();

        foreach (var cycle in cycles)
        {


            // Kiểm tra giờ mở cửa của chi nhánh
            if (branch.CloseTime > branch.OpenTime && (cycle.StartTime < branch.OpenTime || cycle.EndTime > branch.CloseTime))
            {
                return Result.Failure<BookingValidationContext>(
                    new BadError($"Khung giờ {cycle.StartTime:HH:mm} - {cycle.EndTime:HH:mm} nằm ngoài giờ mở cửa của chi nhánh ({branch.OpenTime:HH:mm} - {branch.CloseTime:HH:mm})."));
            }

            var cycleSlots = FixedCycleHelper.GenerateSlots(cycle);
            foreach (var slot in cycleSlots)
            {
                allGeneratedSlots.Add((cycle.CourtTypeId, cycle.PriceTableId, slot.CourtId, slot.Date, slot.StartTime, slot.EndTime));
            }
        }

        if (allGeneratedSlots.Count == 0)
        {
            return Result.Failure<BookingValidationContext>(new BadError("Không có buổi chơi nào được sinh ra từ các chu kì đã chọn (do ngày loại trừ hoặc thứ trong tuần không khớp)."));
        }

        // 3. Kiểm tra trùng lặp nội bộ giữa các chu kì
        for (int i = 0; i < allGeneratedSlots.Count; i++)
        {
            for (int j = i + 1; j < allGeneratedSlots.Count; j++)
            {
                var s1 = allGeneratedSlots[i];
                var s2 = allGeneratedSlots[j];

                if (s1.CourtId == s2.CourtId
                    && s1.Date == s2.Date
                    && s1.StartTime < s2.EndTime
                    && s1.EndTime > s2.StartTime)
                {
                    return Result.Failure<BookingValidationContext>(
                        new BadError($"Trùng lặp khung giờ đặt cho cùng một sân trong các chu kì (ngày {s1.Date:dd/MM/yyyy}: {s1.StartTime:HH:mm} - {s1.EndTime:HH:mm})."));
                }
            }
        }

        // 4. Validate danh sách sân
        var courtIds = allGeneratedSlots.Select(s => s.CourtId).Distinct().ToList();
        var courts = await dbContext.Courts
            .AsNoTracking()
            .Include(c => c.CourtType)
            .Where(c => courtIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        if (courts.Count != courtIds.Count)
        {
            var missingCourtId = courtIds.First(id => courts.All(c => c.Id != id));
            return Result.Failure<BookingValidationContext>(new NotFoundError("Court", missingCourtId));
        }

        foreach (var court in courts)
        {
            if (court.CourtType.BranchId != branchId)
            {
                return Result.Failure<BookingValidationContext>(
                    new BadError($"Sân '{court.Name}' không thuộc chi nhánh đã chọn."));
            }

            if (court.Status != CourtStatus.Available)
            {
                return Result.Failure<BookingValidationContext>(
                    new BadError($"Sân '{court.Name}' hiện đang không khả dụng để đặt (bảo trì hoặc tạm ngưng)."));
            }
        }

        // Kiểm tra tất cả các sân trong từng chu kì phải đúng với CourtTypeId của chu kì đó
        foreach (var cycle in cycles)
        {
            foreach (var courtId in cycle.CourtIds)
            {
                var court = courts.First(c => c.Id == courtId);
                if (court.CourtTypeId != cycle.CourtTypeId)
                {
                    return Result.Failure<BookingValidationContext>(
                        new BadError($"Sân '{court.Name}' không thuộc loại sân đã chọn trong chu kì."));
                }
            }
        }

        // 5. Validate bảng giá (PriceTable) được chỉ định trong từng chu kì
        var priceTableIds = cycles.Select(c => c.PriceTableId).Distinct().ToList();
        var priceTables = await dbContext.PriceTables
            .AsNoTracking()
            .Include(pt => pt.Rules)
            .Where(pt => priceTableIds.Contains(pt.Id))
            .ToListAsync(cancellationToken);

        if (priceTables.Count != priceTableIds.Count)
        {
            var missingPtId = priceTableIds.First(id => priceTables.All(pt => pt.Id != id));
            return Result.Failure<BookingValidationContext>(new NotFoundError("PriceTable", missingPtId));
        }

        foreach (var cycle in cycles)
        {
            var priceTable = priceTables.First(pt => pt.Id == cycle.PriceTableId);
            if (!priceTable.IsActive)
            {
                return Result.Failure<BookingValidationContext>(
                    new BadError($"Bảng giá '{priceTable.Name}' hiện đang không hoạt động."));
            }

            if (priceTable.CourtTypeId != cycle.CourtTypeId)
            {
                return Result.Failure<BookingValidationContext>(
                    new BadError($"Bảng giá '{priceTable.Name}' không áp dụng cho loại sân đã chọn trong chu kì."));
            }
        }

        var calculatedSlots = new List<CalculatedSlotItem>();
        var flatSlots = new List<FlatSlotItem>();

        foreach (var slot in allGeneratedSlots)
        {
            var priceTable = priceTables.First(pt => pt.Id == slot.PriceTableId);

            var price = priceCalculator.CalculatePrice(
                priceTable,
                slot.Date,
                slot.StartTime,
                slot.EndTime,
                isFixedCustomer: true);

            calculatedSlots.Add(new CalculatedSlotItem(slot.CourtId, slot.StartTime, slot.EndTime, price, slot.Date));
            flatSlots.Add(new FlatSlotItem(slot.CourtTypeId, slot.PriceTableId, slot.CourtId, slot.Date, slot.StartTime, slot.EndTime));
        }

        // 6. Validate dịch vụ
        var servicesResult = await ValidateServicesAsync(branchId, services, cancellationToken);
        if (servicesResult.IsFailure)
        {
            return Result.Failure<BookingValidationContext>(servicesResult.Error!);
        }

        return Result<BookingValidationContext>.Success(new BookingValidationContext(
            branch,
            courts,
            calculatedSlots,
            servicesResult.Value,
            flatSlots));
    }

    public async Task<Result> CheckConflictsAsync(
        List<FlatSlotItem> allSlots,
        CancellationToken cancellationToken,
        Guid? excludeOrderId = null)
    {
        var nowUtc = DateTime.UtcNow;
        var courtIds = allSlots.Select(s => s.CourtId).Distinct().ToList();
        var dates = allSlots.Select(s => s.Date).Distinct().ToList();

        var query = dbContext.OrderDetails
            .AsNoTracking()
            .Where(od => courtIds.Contains(od.CourtId)
                      && dates.Contains(od.Date)
                      && od.Order.Status != OrderStatus.Cancelled
                      && (od.Order.Status != OrderStatus.AwaitingPayment || od.Order.HoldExpiresAt > nowUtc));

        if (excludeOrderId.HasValue)
        {
            query = query.Where(od => od.OrderId != excludeOrderId.Value);
        }

        var existingOccupiedSlots = await query
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
}
