using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Analytics.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Analytics.Queries.GetSystemUtilizationStatistics;

internal sealed class GetSystemUtilizationStatisticsQueryHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetSystemUtilizationStatisticsQuery, SystemUtilizationStatisticsDto>
{
    public async Task<Result<SystemUtilizationStatisticsDto>> Handle(
        GetSystemUtilizationStatisticsQuery request,
        CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var toDate = request.ToDate ?? today;
        var fromDate = request.FromDate ?? toDate.AddDays(-29); // Mặc định 30 ngày qua
        var daysCount = (toDate.DayNumber - fromDate.DayNumber) + 1;

        var fromUtc = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toUtcExclusive = toDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        // ══════════════════════════════════════════════════════════════
        // 1. THỐNG KÊ CƠ SỞ & SÂN ĐẤU (FACILITIES & COURTS)
        // ══════════════════════════════════════════════════════════════
        var branchQuery = dbContext.Branches
            .AsNoTracking()
            .Where(b => !b.CourtOwner.User.IsDeleted);

        if (request.BranchId.HasValue)
        {
            branchQuery = branchQuery.Where(b => b.Id == request.BranchId.Value);
        }

        if (request.SportTypeId.HasValue)
        {
            branchQuery = branchQuery.Where(b => b.SportTypeId == request.SportTypeId.Value);
        }

        var totalBranches = await branchQuery.CountAsync(ct);
        var activeBranches = await branchQuery.CountAsync(b => b.IsActive, ct);
        var inactiveBranches = totalBranches - activeBranches;

        var courtQuery = dbContext.Courts
            .AsNoTracking()
            .Where(c => !c.CourtType.Branch.CourtOwner.User.IsDeleted);

        if (request.BranchId.HasValue)
        {
            courtQuery = courtQuery.Where(c => c.CourtType.BranchId == request.BranchId.Value);
        }

        if (request.SportTypeId.HasValue)
        {
            courtQuery = courtQuery.Where(c => c.CourtType.Branch.SportTypeId == request.SportTypeId.Value);
        }

        var totalCourts = await courtQuery.CountAsync(ct);
        var availableCourts = await courtQuery.CountAsync(c => c.Status == CourtStatus.Available, ct);
        var maintenanceCourts = await courtQuery.CountAsync(c => c.Status == CourtStatus.Maintenance, ct);
        var inactiveCourts = await courtQuery.CountAsync(c => c.Status == CourtStatus.Inactive, ct);

        // Thống kê phân bổ theo môn thể thao
        var bySportType = await branchQuery
            .GroupBy(b => new { b.SportTypeId, b.SportType.Name })
            .Select(g => new CourtsBySportTypeDto(
                g.Key.SportTypeId,
                g.Key.Name,
                g.Count(),
                g.SelectMany(b => b.CourtTypes).SelectMany(ct => ct.Courts).Count()))
            .ToListAsync(ct);

        var facilityMetrics = new FacilityMetricsDto(
            totalBranches,
            activeBranches,
            inactiveBranches,
            totalCourts,
            availableCourts,
            maintenanceCourts,
            inactiveCourts,
            bySportType);

        // ══════════════════════════════════════════════════════════════
        // 2. THỐNG KÊ NGƯỜI CHƠI (PLAYER METRICS)
        // ══════════════════════════════════════════════════════════════
        var totalRegisteredPlayers = await dbContext.PlayerProfiles
            .AsNoTracking()
            .CountAsync(p => !p.User.IsDeleted, ct);

        var newPlayersInPeriod = await dbContext.PlayerProfiles
            .AsNoTracking()
            .CountAsync(p => !p.User.IsDeleted && p.CreatedAt >= fromUtc && p.CreatedAt < toUtcExclusive, ct);

        // Người chơi hoạt động: có đơn đặt sân hoặc tham gia trận giao lưu trong kỳ
        var activeOrderPlayersQuery = dbContext.Orders
            .AsNoTracking()
            .Where(o => o.PlayerId != null
                     && o.OrderDate >= fromDate
                     && o.OrderDate <= toDate
                     && o.Status != OrderStatus.Cancelled);

        if (request.BranchId.HasValue)
        {
            activeOrderPlayersQuery = activeOrderPlayersQuery.Where(o => o.BranchId == request.BranchId.Value);
        }

        if (request.SportTypeId.HasValue)
        {
            activeOrderPlayersQuery = activeOrderPlayersQuery.Where(o => o.Branch.SportTypeId == request.SportTypeId.Value);
        }

        var orderPlayerIds = await activeOrderPlayersQuery
            .Select(o => o.PlayerId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var matchParticipantsQuery = dbContext.MatchParticipants
            .AsNoTracking()
            .Where(mp => mp.Match.Date >= fromDate && mp.Match.Date <= toDate);

        if (request.BranchId.HasValue)
        {
            matchParticipantsQuery = matchParticipantsQuery.Where(mp => mp.Match.BranchId == request.BranchId.Value);
        }

        if (request.SportTypeId.HasValue)
        {
            matchParticipantsQuery = matchParticipantsQuery.Where(mp => mp.Match.SportTypeId == request.SportTypeId.Value);
        }

        var matchPlayerIds = await matchParticipantsQuery
            .Select(mp => mp.PlayerId)
            .Distinct()
            .ToListAsync(ct);

        var activePlayersInPeriod = orderPlayerIds.Union(matchPlayerIds).Count();

        var playerMetrics = new PlayerMetricsDto(
            totalRegisteredPlayers,
            activePlayersInPeriod,
            newPlayersInPeriod);

        // ══════════════════════════════════════════════════════════════
        // 3. TỶ LỆ SỬ DỤNG HỆ THỐNG (SYSTEM UTILIZATION RATE)
        // ══════════════════════════════════════════════════════════════
        // a. Tính tổng công suất giờ khả dụng của toàn bộ sân đang Available và chi nhánh Active
        var activeBranchCourts = await courtQuery
            .Where(c => c.Status == CourtStatus.Available && c.CourtType.Branch.IsActive)
            .Select(c => new
            {
                Open = c.CourtType.Branch.OpenTime,
                Close = c.CourtType.Branch.CloseTime
            })
            .ToListAsync(ct);

        double totalCapacityHours = 0;
        foreach (var court in activeBranchCourts)
        {
            double dailyHours = court.Close > court.Open
                ? (court.Close - court.Open).TotalHours
                : (24.0 - (court.Open - court.Close).TotalHours);

            totalCapacityHours += dailyHours * daysCount;
        }

        // b. Tính tổng số giờ đã được đặt từ các OrderDetail hợp lệ (Confirmed, CheckedIn, Completed)
        var orderDetailsQuery = dbContext.OrderDetails
            .AsNoTracking()
            .Where(d => d.Date >= fromDate
                     && d.Date <= toDate
                     && (d.Order.Status == OrderStatus.Confirmed
                         || d.Order.Status == OrderStatus.CheckedIn
                         || d.Order.Status == OrderStatus.Completed));

        if (request.BranchId.HasValue)
        {
            orderDetailsQuery = orderDetailsQuery.Where(d => d.Order.BranchId == request.BranchId.Value);
        }

        if (request.SportTypeId.HasValue)
        {
            orderDetailsQuery = orderDetailsQuery.Where(d => d.Order.Branch.SportTypeId == request.SportTypeId.Value);
        }

        var bookedSlots = await orderDetailsQuery
            .Select(d => new
            {
                d.StartTime,
                d.EndTime,
                d.Date
            })
            .ToListAsync(ct);

        double totalBookedHours = bookedSlots.Sum(s => (s.EndTime - s.StartTime).TotalHours);
        totalBookedHours = Math.Round(totalBookedHours, 2);
        totalCapacityHours = Math.Round(totalCapacityHours, 2);

        decimal overallUtilizationRate = totalCapacityHours > 0
            ? Math.Round((decimal)(totalBookedHours / totalCapacityHours) * 100m, 2)
            : 0m;

        // c. Phân bổ công suất theo từng khung giờ trong ngày (Hourly Distribution)
        var hourlyDistribution = new List<HourlyUtilizationDto>();
        for (int h = 5; h <= 23; h++)
        {
            var hourStart = new TimeSpan(h, 0, 0);
            var hourEnd = new TimeSpan(h + 1, 0, 0);

            double hourBooked = 0;
            int bookingCount = 0;

            foreach (var slot in bookedSlots)
            {
                var slotStart = slot.StartTime.ToTimeSpan();
                var slotEnd = slot.EndTime.ToTimeSpan();

                // Kiểm tra có giao nhau với khung giờ [h, h+1]
                if (slotStart < hourEnd && slotEnd > hourStart)
                {
                    var overlapStart = slotStart > hourStart ? slotStart : hourStart;
                    var overlapEnd = slotEnd < hourEnd ? slotEnd : hourEnd;
                    hourBooked += (overlapEnd - overlapStart).TotalHours;
                    bookingCount++;
                }
            }

            hourlyDistribution.Add(new HourlyUtilizationDto(
                h,
                $"{h:D2}:00 - {(h + 1):D2}:00",
                Math.Round(hourBooked, 2),
                bookingCount));
        }

        // d. Top các khung giờ cao điểm nhất (Top Peak Hours)
        var totalBookingsCount = bookedSlots.Count;
        var topPeakHours = hourlyDistribution
            .Where(x => x.BookingCount > 0)
            .OrderByDescending(x => x.BookingCount)
            .Take(3)
            .Select(x => new PeakHourSummaryDto(
                x.HourLabel,
                x.BookingCount,
                totalBookingsCount > 0 ? Math.Round(((decimal)x.BookingCount / totalBookingsCount) * 100m, 2) : 0m))
            .ToList();

        var utilizationMetrics = new SystemUtilizationMetricsDto(
            totalCapacityHours,
            totalBookedHours,
            overallUtilizationRate,
            hourlyDistribution,
            topPeakHours);

        return Result.Success(new SystemUtilizationStatisticsDto(
            facilityMetrics,
            playerMetrics,
            utilizationMetrics));
    }
}
