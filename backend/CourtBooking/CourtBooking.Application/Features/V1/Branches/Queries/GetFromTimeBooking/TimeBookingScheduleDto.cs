using CourtBooking.Application.Features.V1.Branches.Queries.GetOneTimeBooking;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetFromTimeBooking;

/// <summary>
/// Chi tiết slot đã được đặt/chiếm dụng kèm theo ngày cụ thể.
/// </summary>
public sealed record OccupiedSlotDetailDto(
    Guid CourtId,
    string CourtName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    TimelineSlotStatus Status,
    string? OrderCode,
    string? CustomerName,
    string? Title);

/// <summary>
/// Thông tin lịch theo Loại sân (CourtType) chứa danh sách sân và các slot đã đặt.
/// </summary>
public sealed record CourtTypeScheduleItemDto(
    Guid CourtTypeId,
    string CourtTypeName,
    IReadOnlyList<CourtTimelineItemDto> Courts,
    IReadOnlyList<OccupiedSlotDetailDto> OccupiedSlots);

/// <summary>
/// Lịch đặt sân gom theo Thứ trong tuần (T2 -> CN).
/// </summary>
public sealed record DayOfWeekScheduleDto(
    DayOfWeek DayOfWeek,
    int DayOfWeekNumber, // 2 cho T2, 3 cho T3, ..., 8 cho CN
    string DayOfWeekName, // "Thứ 2", "Thứ 3", ..., "Chủ nhật"
    IReadOnlyList<CourtTypeScheduleItemDto> CourtTypes);

/// <summary>
/// DTO tổng hợp lịch đặt sân theo khoảng ngày của chi nhánh.
/// </summary>
public sealed record TimeBookingScheduleDto(
    Guid BranchId,
    string BranchName,
    DateOnly FromDate,
    DateOnly ToDate,
    TimeOnly OpenTime,
    TimeOnly CloseTime,
    IReadOnlyList<DayOfWeekScheduleDto> Schedules);
