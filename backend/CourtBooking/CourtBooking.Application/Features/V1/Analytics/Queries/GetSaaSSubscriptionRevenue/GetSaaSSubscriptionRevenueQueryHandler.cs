using System.Globalization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Analytics.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Analytics.Queries.GetSaaSSubscriptionRevenue;

internal sealed class GetSaaSSubscriptionRevenueQueryHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetSaaSSubscriptionRevenueQuery, SaaSSubscriptionRevenueDto>
{
    private sealed record SubscriptionRecord(
        Guid Id,
        Guid ServicePackageId,
        string PackageName,
        decimal PricePaid,
        DateTime CreatedAt);

    public async Task<Result<SaaSSubscriptionRevenueDto>> Handle(
        GetSaaSSubscriptionRevenueQuery request,
        CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var toDate = request.ToDate ?? today;
        var fromDate = request.FromDate ?? (request.GroupBy switch
        {
            TimeGrouping.Day => toDate.AddDays(-29), // 30 ngày gần nhất
            TimeGrouping.Month => new DateOnly(toDate.Year, 1, 1), // Từ đầu năm
            TimeGrouping.Year => new DateOnly(toDate.Year - 4, 1, 1), // 5 năm gần nhất
            _ => toDate.AddDays(-29)
        });

        var fromUtc = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toUtcExclusive = toDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        // 1. Lấy dữ liệu các lượt đăng ký trong kỳ hiện tại
        var currentQuery = dbContext.CourtOwnerSubscriptions
            .AsNoTracking()
            .Where(s => s.CreatedAt >= fromUtc && s.CreatedAt < toUtcExclusive);

        if (request.PackageId.HasValue)
        {
            currentQuery = currentQuery.Where(s => s.ServicePackageId == request.PackageId.Value);
        }

        var currentSubscriptions = await currentQuery
            .Select(s => new SubscriptionRecord(
                s.Id,
                s.ServicePackageId,
                s.ServicePackage.Name,
                s.PricePaid,
                s.CreatedAt))
            .ToListAsync(ct);

        // 2. Tính toán kỳ trước liền kề để so sánh tăng trưởng
        var daysSpan = (toDate.DayNumber - fromDate.DayNumber) + 1;
        var prevToDate = fromDate.AddDays(-1);
        var prevFromDate = prevToDate.AddDays(-daysSpan + 1);

        var prevFromUtc = prevFromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var prevToUtcExclusive = prevToDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var prevQuery = dbContext.CourtOwnerSubscriptions
            .AsNoTracking()
            .Where(s => s.CreatedAt >= prevFromUtc && s.CreatedAt < prevToUtcExclusive);

        if (request.PackageId.HasValue)
        {
            prevQuery = prevQuery.Where(s => s.ServicePackageId == request.PackageId.Value);
        }

        var previousPeriodRevenue = await prevQuery
            .SumAsync(s => (decimal?)s.PricePaid, ct) ?? 0m;

        // 3. Tính toán các chỉ số tổng quan
        var totalRevenue = currentSubscriptions.Sum(s => s.PricePaid);
        var totalCount = currentSubscriptions.Count;
        var avgRevenue = totalCount > 0 ? Math.Round(totalRevenue / totalCount, 2) : 0m;

        decimal growthPercentage = 0m;
        if (previousPeriodRevenue > 0)
        {
            growthPercentage = Math.Round(((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100m, 2);
        }
        else if (totalRevenue > 0)
        {
            growthPercentage = 100m;
        }

        // 4. Phân bổ doanh thu theo từng gói cước
        var byPackage = currentSubscriptions
            .GroupBy(s => new { s.ServicePackageId, s.PackageName })
            .Select(g =>
            {
                var pkgRevenue = g.Sum(x => x.PricePaid);
                var pkgCount = g.Count();
                var percentage = totalRevenue > 0
                    ? Math.Round((pkgRevenue / totalRevenue) * 100m, 2)
                    : 0m;

                return new RevenueByPackageItemDto(
                    g.Key.ServicePackageId,
                    g.Key.PackageName,
                    pkgRevenue,
                    pkgCount,
                    percentage);
            })
            .OrderByDescending(p => p.Revenue)
            .ToList();

        // 5. Chuỗi thời gian thống kê (Timeline) liên tục, không bị ngắt quãng
        var timeline = GenerateTimeline(currentSubscriptions, fromDate, toDate, request.GroupBy);

        return Result.Success(new SaaSSubscriptionRevenueDto(
            totalRevenue,
            totalCount,
            avgRevenue,
            previousPeriodRevenue,
            growthPercentage,
            byPackage,
            timeline));
    }

    private static List<RevenueTimelineItemDto> GenerateTimeline(
        IReadOnlyList<SubscriptionRecord> subscriptions,
        DateOnly fromDate,
        DateOnly toDate,
        TimeGrouping grouping)
    {
        var result = new List<RevenueTimelineItemDto>();

        switch (grouping)
        {
            case TimeGrouping.Day:
            {
                for (var day = fromDate; day <= toDate; day = day.AddDays(1))
                {
                    var period = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                    var matched = subscriptions.Where(s => DateOnly.FromDateTime(s.CreatedAt) == day).ToList();
                    result.Add(new RevenueTimelineItemDto(
                        period,
                        day,
                        matched.Sum(s => s.PricePaid),
                        matched.Count));
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
                    var matched = subscriptions.Where(s => s.CreatedAt.Year == y && s.CreatedAt.Month == m).ToList();

                    result.Add(new RevenueTimelineItemDto(
                        period,
                        currentMonth,
                        matched.Sum(s => s.PricePaid),
                        matched.Count));

                    currentMonth = currentMonth.AddMonths(1);
                }
                break;
            }

            case TimeGrouping.Year:
            {
                for (var year = fromDate.Year; year <= toDate.Year; year++)
                {
                    var period = year.ToString(CultureInfo.InvariantCulture);
                    var matched = subscriptions.Where(s => s.CreatedAt.Year == year).ToList();

                    result.Add(new RevenueTimelineItemDto(
                        period,
                        new DateOnly(year, 1, 1),
                        matched.Sum(s => s.PricePaid),
                        matched.Count));
                }
                break;
            }
        }

        return result;
    }
}
