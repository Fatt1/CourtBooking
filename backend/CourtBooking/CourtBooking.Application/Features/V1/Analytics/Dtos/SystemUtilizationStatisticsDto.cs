namespace CourtBooking.Application.Features.V1.Analytics.Dtos;

/// <summary>
/// DTO phản hồi thống kê tổng số lượng cơ sở sân, người chơi hoạt động và tỷ lệ sử dụng hệ thống.
/// </summary>
public sealed record SystemUtilizationStatisticsDto(
    FacilityMetricsDto Facilities,
    PlayerMetricsDto Players,
    SystemUtilizationMetricsDto Utilization);

/// <summary>
/// Thống kê chi tiết về cơ sở và sân thể thao.
/// </summary>
public sealed record FacilityMetricsDto(
    int TotalBranches,
    int ActiveBranches,
    int InactiveBranches,
    int TotalCourts,
    int AvailableCourts,
    int MaintenanceCourts,
    int InactiveCourts,
    IReadOnlyList<CourtsBySportTypeDto> BySportType);

/// <summary>
/// Thống kê cơ sở và sân theo từng môn thể thao.
/// </summary>
public sealed record CourtsBySportTypeDto(
    Guid SportTypeId,
    string SportTypeName,
    int BranchCount,
    int CourtCount);

/// <summary>
/// Thống kê người chơi.
/// </summary>
public sealed record PlayerMetricsDto(
    int TotalRegisteredPlayers,
    int ActivePlayersInPeriod,
    int NewPlayersInPeriod);

/// <summary>
/// Thống kê công suất và tỷ lệ sử dụng hệ thống.
/// </summary>
public sealed record SystemUtilizationMetricsDto(
    double TotalCapacityHours,
    double TotalBookedHours,
    decimal OverallUtilizationRate,
    IReadOnlyList<HourlyUtilizationDto> HourlyDistribution,
    IReadOnlyList<PeakHourSummaryDto> TopPeakHours);

/// <summary>
/// Phân bổ số giờ đặt theo từng khung giờ trong ngày (0:00 - 23:00).
/// </summary>
public sealed record HourlyUtilizationDto(
    int Hour,
    string HourLabel,
    double BookedHours,
    int BookingCount);

/// <summary>
/// Tóm tắt các khung giờ cao điểm (Peak Hours).
/// </summary>
public sealed record PeakHourSummaryDto(
    string TimeSlot,
    int BookingCount,
    decimal PercentageOfTotalBookings);
