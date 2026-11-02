namespace CourtBooking.Application.Features.V1.Analytics.Reports.Models;

public sealed record CourtOwnerRevenueReportData(
    // ── Thông tin chung (Header & Metadata) ───────────────────
    string BrandTitle,
    string CourtOwnerName,
    DateOnly FromDate,
    DateOnly ToDate,
    string BranchFilterName,
    DateTime GeneratedAt,
    string GeneratedBy,

    // ── Chỉ số KPI tổng quan ─────────────────────────────────
    decimal TotalNetRevenue,
    decimal CourtRevenue,
    decimal ServiceRevenue,
    decimal TotalDiscount,
    int TotalBookings,
    int CancelledBookings,
    decimal CancellationRate,
    decimal TotalCancelledAmount,
    decimal OccupancyRate,
    decimal TotalAvailableCourtHours,
    decimal TotalBookedCourtHours,

    // ── Bảng phân bổ theo chi nhánh ──────────────────────────
    IReadOnlyList<ReportBranchBreakdownItem> Branches,

    // ── Cơ cấu doanh thu theo nguồn thu ──────────────────────
    decimal FixedCourtRevenue,
    decimal WalkInCourtRevenue,
    decimal RetailServiceRevenue,
    decimal CancellationRefundAmount,

    // ── Cơ cấu doanh thu theo hình thức thanh toán ───────────
    decimal QrTransferAmount,
    decimal CashAmount,

    // ── Doanh thu theo từng ngày (Timeline) ───────────────────
    IReadOnlyList<ReportDailyTimelineItem> DailyTimeline,

    // ── Doanh thu theo khung giờ (Peak vs Off-peak) ───────────
    IReadOnlyList<ReportHourlySlotItem> HourlySlots,

    // ── Danh sách chi tiết các đơn đặt sân (Excel Sheet 2) ───
    IReadOnlyList<ReportBookingDetailItem> BookingDetails);

public sealed record ReportBranchBreakdownItem(
    Guid BranchId,
    string BranchName,
    int CourtsCount,
    int TotalBookings,
    decimal CourtRevenue,
    decimal ServiceRevenue,
    decimal TotalRevenue,
    decimal ContributionRate);

public sealed record ReportDailyTimelineItem(
    DateOnly Date,
    string DayOfWeekName,
    bool IsWeekend,
    int BookingsCount,
    decimal CourtRevenue,
    decimal ServiceRevenue,
    decimal TotalRevenue);

public sealed record ReportHourlySlotItem(
    string HourSlot,
    int Hour,
    int BookingsCount,
    decimal Revenue,
    bool IsPeakHour);

public sealed record ReportBookingDetailItem(
    string OrderCode,
    string BranchName,
    string CustomerName,
    string CustomerPhone,
    string Channel,
    string OrderType,
    DateOnly PlayDate,
    string TimeSlot,
    decimal CourtPrice,
    decimal ServicePrice,
    decimal DiscountAmount,
    decimal TotalAmount,
    string Status);

