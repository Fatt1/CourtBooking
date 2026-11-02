using System.Globalization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Analytics.Reports.Models;
using CourtBooking.Application.Features.V1.Analytics.Reports.Services;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Infrastructure.Analytics.Reports;

public sealed class ReportDataAggregator(IApplicationDbContext dbContext) : IReportDataAggregator
{
    private sealed record TransactionSummary(
        Guid BranchId,
        DateTime CreatedAt,
        DateOnly Date,
        decimal Amount,
        PaymentTransactionType Type,
        PaymentMethod Method,
        decimal NetAmount);

    public async Task<CourtOwnerRevenueReportData> AggregateRevenueReportDataAsync(
        Guid courtOwnerId,
        DateOnly fromDate,
        DateOnly toDate,
        Guid? branchId,
        CancellationToken ct = default)
    {
        // 1. Lấy thông tin Chủ sân
        var owner = await dbContext.CourtOwners
            .AsNoTracking()
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == courtOwnerId, ct);

        var ownerName = owner?.User?.FullName ?? "Chủ sân";
        var brandTitle = owner?.User?.FullName != null ? $"Hệ thống sân {owner.User.FullName}" : "CourtBooking Matchday";

        // 2. Lấy danh sách chi nhánh thuộc quyền quản lý
        var branchesQuery = dbContext.Branches
            .AsNoTracking()
            .Include(b => b.CourtTypes)
            .ThenInclude(ct => ct.Courts)
            .Where(b => b.CourtOwnerId == courtOwnerId);

        if (branchId.HasValue)
        {
            branchesQuery = branchesQuery.Where(b => b.Id == branchId.Value);
        }

        var branches = await branchesQuery.ToListAsync(ct);
        var branchIds = branches.Select(b => b.Id).ToList();
        var branchFilterName = branchId.HasValue && branches.Count > 0
            ? branches[0].Name
            : "Tất cả chi nhánh";

        // 3. Truy vấn Orders (Đơn đặt sân)
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Details)
            .Include(o => o.Branch)
            .Where(o => branchIds.Contains(o.BranchId)
                     && o.OrderDate >= fromDate
                     && o.OrderDate <= toDate)
            .ToListAsync(ct);

        var nonCancelledOrders = orders.Where(o => o.Status != OrderStatus.Cancelled).ToList();
        var cancelledOrders = orders.Where(o => o.Status == OrderStatus.Cancelled).ToList();

        // 4. Truy vấn PaymentTransactions (Giao dịch thanh toán thực thu)
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
                BranchId = t.Order!.BranchId,
                t.Amount,
                t.Type,
                t.Method,
                t.CreatedAt
            })
            .ToListAsync(ct);

        var transactions = rawTransactions.Select(t =>
        {
            var sign = t.Type == PaymentTransactionType.Refund ? -1m : 1m;
            return new TransactionSummary(
                t.BranchId,
                t.CreatedAt,
                DateOnly.FromDateTime(t.CreatedAt),
                t.Amount,
                t.Type,
                t.Method,
                t.Amount * sign);
        }).ToList();

        // 5. Truy vấn RetailOrders (Bán lẻ dịch vụ POS)
        var retailOrders = await dbContext.RetailOrders
            .AsNoTracking()
            .Where(ro => branchIds.Contains(ro.BranchId)
                     && ro.OrderDate >= fromDate
                     && ro.OrderDate <= toDate)
            .Select(ro => new
            {
                ro.Id,
                ro.BranchId,
                ro.OrderDate,
                ro.TotalAmount,
                ro.DiscountAmount
            })
            .ToListAsync(ct);

        // 6. Tính toán KPI tổng quan
        var courtRevenue = transactions.Sum(t => t.NetAmount);
        var serviceRevenue = retailOrders.Sum(ro => ro.TotalAmount);
        var totalDiscount = nonCancelledOrders.Sum(o => o.DiscountAmount) + retailOrders.Sum(ro => ro.DiscountAmount);
        var totalNetRevenue = courtRevenue + serviceRevenue;

        var totalBookings = orders.Count;
        var cancelledBookings = cancelledOrders.Count;
        var cancellationRate = totalBookings > 0
            ? Math.Round((decimal)cancelledBookings / totalBookings * 100m, 2)
            : 0m;
        var totalCancelledAmount = cancelledOrders.Sum(o => o.TotalAmount);

        // 7. Tính Tỷ lệ lấp đầy sân (Occupancy Rate)
        var daysCount = Math.Max(1, toDate.DayNumber - fromDate.DayNumber + 1);
        var totalAvailableCourtHours = 0m;

        foreach (var b in branches)
        {
            var dailyOpenHours = Math.Max(0m, (decimal)(b.CloseTime - b.OpenTime).TotalHours);
            var branchCourtsCount = b.CourtTypes.SelectMany(ct => ct.Courts).Count();
            totalAvailableCourtHours += dailyOpenHours * branchCourtsCount * daysCount;
        }

        var validDetails = nonCancelledOrders
            .SelectMany(o => o.Details)
            .Where(d => d.Date >= fromDate && d.Date <= toDate)
            .ToList();

        var totalBookedCourtHours = validDetails.Sum(d => Math.Max(0m, (decimal)(d.EndTime - d.StartTime).TotalHours));
        var occupancyRate = totalAvailableCourtHours > 0
            ? Math.Round((totalBookedCourtHours / totalAvailableCourtHours) * 100m, 2)
            : 0m;

        // 8. Bảng phân bổ theo chi nhánh (Branch Breakdown)
        var branchBreakdown = branches.Select(b =>
        {
            var bTx = transactions.Where(t => t.BranchId == b.Id).ToList();
            var bRetail = retailOrders.Where(ro => ro.BranchId == b.Id).ToList();
            var bOrders = orders.Where(o => o.BranchId == b.Id).ToList();

            var bCourtRev = bTx.Sum(t => t.NetAmount);
            var bServiceRev = bRetail.Sum(ro => ro.TotalAmount);
            var bTotalRev = bCourtRev + bServiceRev;
            var bBookings = bOrders.Count;
            var contributionRate = totalNetRevenue > 0
                ? Math.Round((bTotalRev / totalNetRevenue) * 100m, 2)
                : 0m;

            return new ReportBranchBreakdownItem(
                b.Id,
                b.Name,
                b.CourtTypes.SelectMany(ct => ct.Courts).Count(),
                bBookings,
                bCourtRev,
                bServiceRev,
                bTotalRev,
                contributionRate);
        }).OrderByDescending(b => b.TotalRevenue).ToList();

        // 9. Cơ cấu doanh thu theo nguồn thu & phương thức thanh toán
        var fixedCourtRevenue = nonCancelledOrders
            .Where(o => o.OrderType == OrderType.Fixed)
            .Sum(o => o.TotalCourtAmount);
        var walkInCourtRevenue = nonCancelledOrders
            .Where(o => o.OrderType == OrderType.Normal)
            .Sum(o => o.TotalCourtAmount);
        var retailServiceRevenue = serviceRevenue;
        var cancellationRefundAmount = totalCancelledAmount;

        var qrTransferAmount = transactions
            .Where(t => t.Method == PaymentMethod.QrTransfer && t.Type == PaymentTransactionType.Payment)
            .Sum(t => t.Amount);
        var cashAmount = transactions
            .Where(t => t.Method == PaymentMethod.Cash && t.Type == PaymentTransactionType.Payment)
            .Sum(t => t.Amount);

        // 10. Doanh thu theo từng ngày (Timeline)
        var dailyTimeline = new List<ReportDailyTimelineItem>();
        for (var d = fromDate; d <= toDate; d = d.AddDays(1))
        {
            var dayTx = transactions.Where(t => t.Date == d).ToList();
            var dayRetail = retailOrders.Where(ro => ro.OrderDate == d).ToList();
            var dayOrders = orders.Where(o => o.OrderDate == d).ToList();

            var dayCourtRev = dayTx.Sum(t => t.NetAmount);
            var dayServiceRev = dayRetail.Sum(ro => ro.TotalAmount);
            var dayTotalRev = dayCourtRev + dayServiceRev;
            var isWeekend = d.DayOfWeek == DayOfWeek.Saturday || d.DayOfWeek == DayOfWeek.Sunday;

            dailyTimeline.Add(new ReportDailyTimelineItem(
                d,
                GetVietnameseDayOfWeek(d.DayOfWeek),
                isWeekend,
                dayOrders.Count,
                dayCourtRev,
                dayServiceRev,
                dayTotalRev));
        }

        // 11. Doanh thu theo khung giờ (Hourly Peak vs Off-peak)
        var hourlySlots = new List<ReportHourlySlotItem>();
        for (var hour = 5; hour <= 23; hour++)
        {
            var nextHour = hour + 1;
            var slotLabel = $"{hour:D2}:00 - {nextHour:D2}:00";
            var isPeakHour = hour >= 17 && hour <= 21; // Khung giờ vàng từ 17:00 đến 22:00

            var matchingDetails = validDetails
                .Where(d => d.StartTime.Hour <= hour && d.EndTime.Hour > hour)
                .ToList();

            var slotRevenue = matchingDetails.Sum(d => d.Price);
            var slotBookings = matchingDetails.Count;

            hourlySlots.Add(new ReportHourlySlotItem(
                slotLabel,
                hour,
                slotBookings,
                slotRevenue,
                isPeakHour));
        }

        // 12. Danh sách chi tiết các đơn đặt sân (Excel Sheet 2)
        var bookingDetails = orders
            .OrderByDescending(o => o.OrderDate)
            .Take(1500)
            .Select(o =>
            {
                var firstDetail = o.Details.OrderBy(d => d.StartTime).FirstOrDefault();
                var timeSlot = firstDetail != null
                    ? $"{firstDetail.StartTime:HH\\:mm} - {firstDetail.EndTime:HH\\:mm}"
                    : "N/A";
                var playDate = firstDetail?.Date ?? o.OrderDate;

                var orderTypeStr = o.OrderType switch
                {
                    OrderType.Fixed => "Cố định (Tháng)",
                    OrderType.Event => "Sự kiện",
                    _ => "Vãng lai"
                };

                var channelStr = o.Channel == OrderChannel.Pos ? "Tại quầy (POS)" : "Online";
                var statusStr = o.Status switch
                {
                    OrderStatus.Completed => "Hoàn thành",
                    OrderStatus.Confirmed => "Đã xác nhận",
                    OrderStatus.Cancelled => "Đã hủy",
                    OrderStatus.AwaitingPayment => "Chờ thanh toán",
                    _ => o.Status.ToString()
                };

                return new ReportBookingDetailItem(
                    o.OrderCode,
                    o.Branch?.Name ?? "N/A",
                    o.CustomerName,
                    o.CustomerPhone,
                    channelStr,
                    orderTypeStr,
                    playDate,
                    timeSlot,
                    o.TotalCourtAmount,
                    o.TotalServiceAmount,
                    o.DiscountAmount,
                    o.TotalAmount,
                    statusStr);
            }).ToList();

        return new CourtOwnerRevenueReportData(
            brandTitle,
            ownerName,
            fromDate,
            toDate,
            branchFilterName,
            DateTime.UtcNow,
            ownerName,
            totalNetRevenue,
            courtRevenue,
            serviceRevenue,
            totalDiscount,
            totalBookings,
            cancelledBookings,
            cancellationRate,
            totalCancelledAmount,
            occupancyRate,
            totalAvailableCourtHours,
            totalBookedCourtHours,
            branchBreakdown,
            fixedCourtRevenue,
            walkInCourtRevenue,
            retailServiceRevenue,
            cancellationRefundAmount,
            qrTransferAmount,
            cashAmount,
            dailyTimeline,
            hourlySlots,
            bookingDetails);
    }

    private static string GetVietnameseDayOfWeek(DayOfWeek dayOfWeek) => dayOfWeek switch
    {
        DayOfWeek.Monday => "Thứ Hai",
        DayOfWeek.Tuesday => "Thứ Ba",
        DayOfWeek.Wednesday => "Thứ Tư",
        DayOfWeek.Thursday => "Thứ Năm",
        DayOfWeek.Friday => "Thứ Sáu",
        DayOfWeek.Saturday => "Thứ Bảy",
        DayOfWeek.Sunday => "Chủ Nhật",
        _ => dayOfWeek.ToString()
    };
}

