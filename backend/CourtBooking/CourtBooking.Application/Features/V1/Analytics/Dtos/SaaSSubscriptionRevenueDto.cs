namespace CourtBooking.Application.Features.V1.Analytics.Dtos;

/// <summary>
/// Kiểu gom nhóm chuỗi thời gian thống kê.
/// </summary>
public enum TimeGrouping
{
    Day = 0,
    Month = 1,
    Year = 2
}

/// <summary>
/// DTO phản hồi thống kê tổng doanh thu bán gói cước SaaS.
/// </summary>
public sealed record SaaSSubscriptionRevenueDto(
    decimal TotalRevenue,
    int TotalSubscriptionsSold,
    decimal AverageRevenuePerSubscription,
    decimal PreviousPeriodRevenue,
    decimal GrowthPercentage,
    IReadOnlyList<RevenueByPackageItemDto> ByPackage,
    IReadOnlyList<RevenueTimelineItemDto> Timeline);

/// <summary>
/// DTO phân bổ doanh thu theo từng gói cước.
/// </summary>
public sealed record RevenueByPackageItemDto(
    Guid PackageId,
    string PackageName,
    decimal Revenue,
    int TotalSold,
    decimal Percentage);

/// <summary>
/// DTO một điểm trên chuỗi thời gian thống kê doanh thu (biểu đồ đường/cột).
/// </summary>
public sealed record RevenueTimelineItemDto(
    string Period,
    DateOnly StartDate,
    decimal Revenue,
    int SubscriptionCount);
