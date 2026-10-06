namespace CourtBooking.Application.Features.V1.Analytics.Dtos;

/// <summary>
/// DTO phản hồi thống kê tổng doanh thu và chỉ số vận hành dành cho Chủ Sân.
/// </summary>
public sealed record CourtOwnerRevenueDto(
    // ── KPI Tổng Doanh Thu ─────────────────────────────────────
    decimal TotalNetRevenue,
    decimal CourtRevenue,
    decimal ServiceRevenue,
    decimal EventRevenue,
    decimal TotalDiscount,

    // ── Chỉ Số Vận Hành ───────────────────────────────────────
    int TotalBookings,
    int OnlineBookings,
    int PosBookings,
    int CancelledBookings,
    decimal CancellationRate,
    decimal TotalCancelledAmount,

    // ── Phân Bổ Chi Nhánh & Biểu Đồ Chuỗi Thời Gian ────────────
    IReadOnlyList<BranchRevenueItemDto> ByBranch,
    IReadOnlyList<CourtOwnerTimelineItemDto> Timeline);

/// <summary>
/// DTO phân bổ doanh thu và lượt đặt theo từng chi nhánh của chủ sân.
/// </summary>
public sealed record BranchRevenueItemDto(
    Guid BranchId,
    string BranchName,
    decimal CourtRevenue,
    decimal ServiceRevenue,
    decimal TotalRevenue,
    int TotalBookings);

/// <summary>
/// DTO một điểm trên chuỗi thời gian thống kê doanh thu và lượt đặt sân.
/// </summary>
public sealed record CourtOwnerTimelineItemDto(
    string Period,
    DateOnly Date,
    decimal CourtRevenue,
    decimal ServiceRevenue,
    decimal TotalRevenue,
    int BookingsCount);
