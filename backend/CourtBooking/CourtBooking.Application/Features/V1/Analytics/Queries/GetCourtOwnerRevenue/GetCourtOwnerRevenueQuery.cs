using CourtBooking.Application.Features.V1.Analytics.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Analytics.Queries.GetCourtOwnerRevenue;

/// <summary>
/// Query thống kê doanh thu và chỉ số vận hành dành cho Chủ Sân.
/// </summary>
public sealed record GetCourtOwnerRevenueQuery(
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    Guid? BranchId = null,
    TimeGrouping GroupBy = TimeGrouping.Day) : IQuery<CourtOwnerRevenueDto>;
