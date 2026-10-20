using System.Globalization;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Analytics.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Analytics.Queries.GetCourtOwnerRevenue;

internal sealed class GetCourtOwnerRevenueQueryHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth,
    IUserContext userContext)
    : IQueryHandler<GetCourtOwnerRevenueQuery, CourtOwnerRevenueDto>
{
    private sealed record OrderRecord(
        Guid Id,
        Guid BranchId,
        DateOnly OrderDate,
        OrderStatus Status,
        OrderChannel Channel,
        decimal TotalCourtAmount,
        decimal TotalServiceAmount,
        decimal DiscountAmount,
        decimal TotalAmount);

    private sealed record RetailOrderRecord(
        Guid Id,
        Guid BranchId,
        DateOnly OrderDate,
        decimal TotalAmount,
        decimal DiscountAmount);

    private sealed record TransactionRevenueRecord(
        Guid Id,
        Guid? OrderId,
        Guid BranchId,
        DateTime CreatedAt,
        DateOnly Date,
        decimal NetAmount);

    public async Task<Result<CourtOwnerRevenueDto>> Handle(
        GetCourtOwnerRevenueQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Xác định UserId chủ sân (hỗ trợ fallback nếu chưa có token để dễ test Postman/Scalar)
        var currentUserId = userContext.UserId;
        if (currentUserId == Guid.Empty)
        {
            if (request.BranchId.HasValue)
            {
                currentUserId = await dbContext.Branches
                    .AsNoTracking()
                    .Where(b => b.Id == request.BranchId.Value)
                    .Select(b => b.CourtOwnerId)
                    .FirstOrDefaultAsync(cancellationToken);
            }
            else
            {
                currentUserId = await dbContext.CourtOwners
                    .AsNoTracking()
                    .Select(o => o.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            }
        }

        if (currentUserId == Guid.Empty)
        {
            return Result.Failure<CourtOwnerRevenueDto>(
                new ForbiddenError("Người dùng chưa được xác thực hoặc không tìm thấy thông tin chủ sân."));
        }

        // 2. Phạm vi dữ liệu (BR1): Kiểm tra quyền sở hữu chi nhánh
        if (request.BranchId.HasValue)
        {
            if (userContext.IsAuthenticated && userContext.UserId != Guid.Empty)
            {
                var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId.Value, cancellationToken);
                if (authResult.IsFailure)
                {
                    return Result.Failure<CourtOwnerRevenueDto>(authResult.Error!);
                }
            }
            else
            {
                var isOwner = await dbContext.Branches
                    .AsNoTracking()
                    .AnyAsync(b => b.Id == request.BranchId.Value && b.CourtOwnerId == currentUserId, cancellationToken);

                if (!isOwner)
                {
                    return Result.Failure<CourtOwnerRevenueDto>(
                        new ForbiddenError("Bạn không có quyền truy cập dữ liệu của chi nhánh này."));
                }
            }
        }

        // Lấy danh sách chi nhánh thuộc quyền quản lý của chủ sân
        var branchesQuery = dbContext.Branches
            .AsNoTracking()
            .Where(b => b.CourtOwnerId == currentUserId);

        if (request.BranchId.HasValue)
        {
            branchesQuery = branchesQuery.Where(b => b.Id == request.BranchId.Value);
        }

        var ownerBranches = await branchesQuery
            .Select(b => new { b.Id, b.Name })
            .ToListAsync(cancellationToken);

        var branchIds = ownerBranches.Select(b => b.Id).ToList();

        if (branchIds.Count == 0)
        {
            return Result.Success(new CourtOwnerRevenueDto(
                0m, 0m, 0m, 0m, 0m,
                0, 0, 0, 0, 0m, 0m,
                [], []));
        }

        // 3. Xử lý khoảng thời gian (Date Range)
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var toDate = request.ToDate ?? today;
        var fromDate = request.FromDate ?? (request.GroupBy switch
        {
            TimeGrouping.Day => toDate.AddDays(-29), // 30 ngày gần nhất
            TimeGrouping.Month => new DateOnly(toDate.Year, 1, 1), // Từ đầu năm
            TimeGrouping.Year => new DateOnly(toDate.Year - 4, 1, 1), // 5 năm gần nhất
            _ => toDate.AddDays(-29)
        });

        if (fromDate > toDate)
        {
            return Result.Failure<CourtOwnerRevenueDto>(
                new BadError("Ngày bắt đầu (FromDate) phải nhỏ hơn hoặc bằng ngày kết thúc (ToDate)."));
        }

        // 4. Truy vấn Orders (Đơn đặt sân) cho các chỉ số vận hành
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => branchIds.Contains(o.BranchId)
                        && o.OrderDate >= fromDate
                        && o.OrderDate <= toDate)
            .Select(o => new OrderRecord(
                o.Id,
                o.BranchId,
                o.OrderDate,
                o.Status,
                o.Channel,
                o.TotalCourtAmount,
                o.TotalServiceAmount,
                o.DiscountAmount,
                o.TotalCourtAmount + o.TotalServiceAmount - o.DiscountAmount))
            .ToListAsync(cancellationToken);

        var cancelledOrders = orders
            .Where(o => o.Status == OrderStatus.Cancelled)
            .ToList();

        // 5. Truy vấn PaymentTransactions (Giao dịch thanh toán thực thu từ các đơn đặt sân)
        var fromDateTime = fromDate.ToDateTime(TimeOnly.MinValue);
        var toDateTime = toDate.ToDateTime(TimeOnly.MaxValue);

        var rawTransactions = await dbContext.PaymentTransactions
            .AsNoTracking()
            .Where(t => t.OrderId != null
                     && branchIds.Contains(t.Order!.BranchId)
                     && t.CreatedAt >= fromDateTime
                     && t.CreatedAt <= toDateTime)
            .Select(t => new
            {
                t.Id,
                t.OrderId,
                BranchId = t.Order!.BranchId,
                t.Amount,
                t.Type,
                t.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var transactionRecords = rawTransactions.Select(t =>
        {
            var sign = t.Type == PaymentTransactionType.Refund ? -1m : 1m;
            var netAmount = t.Amount * sign;

            return new TransactionRevenueRecord(
                t.Id,
                t.OrderId,
                t.BranchId,
                t.CreatedAt,
                DateOnly.FromDateTime(t.CreatedAt),
                netAmount);
        }).ToList();

        // 6. Truy vấn RetailOrders (Bán lẻ dịch vụ POS tại quầy)
        var retailOrders = await dbContext.RetailOrders
            .AsNoTracking()
            .Where(ro => branchIds.Contains(ro.BranchId)
                         && ro.OrderDate >= fromDate
                         && ro.OrderDate <= toDate)
            .Select(ro => new RetailOrderRecord(
                ro.Id,
                ro.BranchId,
                ro.OrderDate,
                ro.TotalAmount,
                ro.DiscountAmount))
            .ToListAsync(cancellationToken);

        // 7. Truy vấn EventTickets (Vé sự kiện)
        var eventTickets = await dbContext.EventTickets
            .AsNoTracking()
            .Where(t => branchIds.Contains(t.Event.Order.BranchId)
                        && t.Status == EventTicketStatus.Confirmed
                        && t.Event.Order.Details.Any(d => d.Date >= fromDate && d.Date <= toDate))
            .Select(t => new
            {
                t.Id,
                t.Price,
                t.Quantity
            })
            .ToListAsync(cancellationToken);

        // 8. Bóc tách doanh thu thực thu: Toàn bộ thanh toán đơn đặt sân là CourtRevenue, ServiceRevenue chỉ tính từ bán lẻ tại quầy
        var courtRevenue = transactionRecords.Sum(t => t.NetAmount);
        var serviceRevenue = retailOrders.Sum(ro => ro.TotalAmount);
        var eventRevenue = eventTickets.Sum(t => t.Price * t.Quantity);
        var totalDiscount = orders.Where(o => o.Status != OrderStatus.Cancelled).Sum(o => o.DiscountAmount) + retailOrders.Sum(ro => ro.DiscountAmount);
        var totalNetRevenue = courtRevenue + serviceRevenue + eventRevenue;

        // 9. Chỉ số vận hành (Operational Metrics)
        var totalBookings = orders.Count;
        var onlineBookings = orders.Count(o => o.Channel == OrderChannel.Online);
        var posBookings = orders.Count(o => o.Channel == OrderChannel.Pos);
        var cancelledBookings = cancelledOrders.Count;
        var cancellationRate = totalBookings > 0
            ? Math.Round((decimal)cancelledBookings / totalBookings * 100m, 2)
            : 0m;
        var totalCancelledAmount = cancelledOrders.Sum(o => o.TotalAmount);

        // 10. Phân bổ theo chi nhánh (ByBranch)
        var byBranch = ownerBranches.Select(b =>
        {
            var bTx = transactionRecords.Where(t => t.BranchId == b.Id).ToList();
            var bRetailOrders = retailOrders.Where(ro => ro.BranchId == b.Id).ToList();
            var bAllOrders = orders.Where(o => o.BranchId == b.Id).ToList();

            var bCourtRevenue = bTx.Sum(t => t.NetAmount);
            var bServiceRevenue = bRetailOrders.Sum(ro => ro.TotalAmount);
            var bTotalRevenue = bCourtRevenue + bServiceRevenue;
            var bTotalBookings = bAllOrders.Count;

            return new BranchRevenueItemDto(
                b.Id,
                b.Name,
                bCourtRevenue,
                bServiceRevenue,
                bTotalRevenue,
                bTotalBookings);
        }).OrderByDescending(b => b.TotalRevenue).ToList();

        // 11. Chuỗi thời gian biểu đồ (Timeline)
        var timeline = GenerateTimeline(transactionRecords, retailOrders, orders, fromDate, toDate, request.GroupBy);

        return Result.Success(new CourtOwnerRevenueDto(
            totalNetRevenue,
            courtRevenue,
            serviceRevenue,
            eventRevenue,
            totalDiscount,
            totalBookings,
            onlineBookings,
            posBookings,
            cancelledBookings,
            cancellationRate,
            totalCancelledAmount,
            byBranch,
            timeline));
    }

    private static List<CourtOwnerTimelineItemDto> GenerateTimeline(
        IReadOnlyList<TransactionRevenueRecord> transactions,
        IReadOnlyList<RetailOrderRecord> retailOrders,
        IReadOnlyList<OrderRecord> allOrders,
        DateOnly fromDate,
        DateOnly toDate,
        TimeGrouping grouping)
    {
        var result = new List<CourtOwnerTimelineItemDto>();

        switch (grouping)
        {
            case TimeGrouping.Day:
            {
                for (var day = fromDate; day <= toDate; day = day.AddDays(1))
                {
                    var period = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                    var dayTx = transactions.Where(t => t.Date == day).ToList();
                    var dayRetailOrders = retailOrders.Where(ro => ro.OrderDate == day).ToList();
                    var dayOrders = allOrders.Where(o => o.OrderDate == day).ToList();

                    var courtRevenue = dayTx.Sum(t => t.NetAmount);
                    var serviceRevenue = dayRetailOrders.Sum(ro => ro.TotalAmount);
                    var totalRevenue = courtRevenue + serviceRevenue;
                    var bookingsCount = dayOrders.Count;

                    result.Add(new CourtOwnerTimelineItemDto(
                        period,
                        day,
                        courtRevenue,
                        serviceRevenue,
                        totalRevenue,
                        bookingsCount));
                }
                break;
            }

            case TimeGrouping.Month:
            {
                var currentMonth = new DateOnly(fromDate.Year, fromDate.Month, 1);
                var endMonth = new DateOnly(toDate.Year, toDate.Month, 1);

                while (currentMonth <= endMonth)
                {
                    var period = currentMonth.ToString("yyyy-MM", CultureInfo.InvariantCulture);
                    var y = currentMonth.Year;
                    var m = currentMonth.Month;

                    var monthTx = transactions.Where(t => t.Date.Year == y && t.Date.Month == m).ToList();
                    var monthRetailOrders = retailOrders.Where(ro => ro.OrderDate.Year == y && ro.OrderDate.Month == m).ToList();
                    var monthOrders = allOrders.Where(o => o.OrderDate.Year == y && o.OrderDate.Month == m).ToList();

                    var courtRevenue = monthTx.Sum(t => t.NetAmount);
                    var serviceRevenue = monthRetailOrders.Sum(ro => ro.TotalAmount);
                    var totalRevenue = courtRevenue + serviceRevenue;
                    var bookingsCount = monthOrders.Count;

                    result.Add(new CourtOwnerTimelineItemDto(
                        period,
                        currentMonth,
                        courtRevenue,
                        serviceRevenue,
                        totalRevenue,
                        bookingsCount));

                    currentMonth = currentMonth.AddMonths(1);
                }
                break;
            }

            case TimeGrouping.Year:
            {
                for (var year = fromDate.Year; year <= toDate.Year; year++)
                {
                    var period = year.ToString(CultureInfo.InvariantCulture);
                    var yearTx = transactions.Where(t => t.Date.Year == year).ToList();
                    var yearRetailOrders = retailOrders.Where(ro => ro.OrderDate.Year == year).ToList();
                    var yearOrders = allOrders.Where(o => o.OrderDate.Year == year).ToList();

                    var courtRevenue = yearTx.Sum(t => t.NetAmount);
                    var serviceRevenue = yearRetailOrders.Sum(ro => ro.TotalAmount);
                    var totalRevenue = courtRevenue + serviceRevenue;
                    var bookingsCount = yearOrders.Count;

                    result.Add(new CourtOwnerTimelineItemDto(
                        period,
                        new DateOnly(year, 1, 1),
                        courtRevenue,
                        serviceRevenue,
                        totalRevenue,
                        bookingsCount));
                }
                break;
            }
        }

        return result;
    }
}
