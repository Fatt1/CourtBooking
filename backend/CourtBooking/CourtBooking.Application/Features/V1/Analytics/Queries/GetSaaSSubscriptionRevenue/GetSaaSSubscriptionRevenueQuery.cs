using CourtBooking.Application.Features.V1.Analytics.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Analytics.Queries.GetSaaSSubscriptionRevenue;

/// <summary>
/// Query thống kê tổng doanh thu từ việc bán gói cước SaaS cho các chủ sân.
/// </summary>
public sealed record GetSaaSSubscriptionRevenueQuery(
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    TimeGrouping GroupBy = TimeGrouping.Month,
    Guid? PackageId = null) : IQuery<SaaSSubscriptionRevenueDto>;
