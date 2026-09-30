using CourtBooking.Application.Abstractions.Courts;
using CourtBooking.Application.Data;
using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Services;

/// <summary>
/// Triển khai dịch vụ tính giá sân thể thao theo các khung giờ và quy tắc bảng giá.
/// </summary>
public sealed class PriceCalculator(IApplicationDbContext dbContext) : IPriceCalculator
{
    public decimal CalculatePrice(
        PriceTable priceTable,
        DateOnly date,
        TimeOnly startTime,
        TimeOnly endTime,
        bool isFixedCustomer = false)
    {
        if (startTime >= endTime)
        {
            return 0m;
        }

        byte dayOfWeek = (byte)date.DayOfWeek;

        // Lọc các rule phù hợp với ngày và thứ trong tuần
        var applicableRules = priceTable.Rules
            .Where(r => (!r.StartDate.HasValue || date >= r.StartDate.Value)
                     && (!r.EndDate.HasValue || date <= r.EndDate.Value)
                     && IsDayMatching(dayOfWeek, r.DayOfWeekFrom, r.DayOfWeekTo))
            .ToList();

        decimal totalPrice = 0m;
        var current = startTime;

        while (current < endTime)
        {
            // Tìm rule bao phủ mốc 'current' hiện tại
            var activeRule = applicableRules.FirstOrDefault(r => r.StartTime <= current && current < r.EndTime);

            decimal hourlyRate = priceTable.DefaultPrice;
            if (activeRule != null)
            {
                hourlyRate = isFixedCustomer ? activeRule.FixedCustomerPrice : activeRule.WalkInCustomerPrice;
            }

            // Xác định ranh giới tiếp theo (Boundary)
            var nextBoundary = endTime;

            if (activeRule != null && activeRule.EndTime < nextBoundary && activeRule.EndTime > current)
            {
                nextBoundary = activeRule.EndTime;
            }

            foreach (var rule in applicableRules)
            {
                if (rule.StartTime > current && rule.StartTime < nextBoundary)
                {
                    nextBoundary = rule.StartTime;
                }
            }

            // Tính số giờ trong phân đoạn [current, nextBoundary]
            var duration = nextBoundary.ToTimeSpan() - current.ToTimeSpan();
            var hours = (decimal)duration.TotalHours;

            totalPrice += Math.Round(hours * hourlyRate, 2, MidpointRounding.AwayFromZero);
            current = nextBoundary;
        }

        return totalPrice;
    }

    public async Task<decimal?> CalculateSlotPriceAsync(
        Guid priceTableId,
        DateOnly date,
        TimeOnly startTime,
        TimeOnly endTime,
        bool isFixedCustomer = false,
        CancellationToken cancellationToken = default)
    {
        if (startTime >= endTime)
        {
            return 0m;
        }

        var priceTable = await dbContext.PriceTables
            .AsNoTracking()
            .Include(pt => pt.Rules)
            .FirstOrDefaultAsync(pt => pt.Id == priceTableId, cancellationToken);

        if (priceTable == null || !priceTable.IsActive)
        {
            return null;
        }

        return CalculatePrice(priceTable, date, startTime, endTime, isFixedCustomer);
    }

    /// <summary>
    /// Kiểm tra thứ trong tuần có nằm trong khoảng [from, to] hay không.
    /// </summary>
    private static bool IsDayMatching(byte day, byte from, byte to)
    {
        return from <= to
            ? (day >= from && day <= to)
            : (day >= from || day <= to);
    }
}
