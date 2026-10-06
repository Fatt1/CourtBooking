using CourtBooking.Application.Features.V1.Analytics.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Analytics.Queries.GetSystemUtilizationStatistics;

/// <summary>
/// Query thống kê tổng số lượng cơ sở sân, số lượng người chơi hoạt động và tỷ lệ sử dụng hệ thống.
/// </summary>
public sealed record GetSystemUtilizationStatisticsQuery(
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    Guid? BranchId = null,
    Guid? SportTypeId = null) : IQuery<SystemUtilizationStatisticsDto>;
