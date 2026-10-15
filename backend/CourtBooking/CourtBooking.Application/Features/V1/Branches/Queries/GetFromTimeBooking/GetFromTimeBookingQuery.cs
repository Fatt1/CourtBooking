using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetFromTimeBooking;

/// <summary>
/// Query lấy danh sách lịch đặt sân theo khoảng ngày (tối đa 1 tháng) nhóm theo Thứ (T2 -> CN) và Loại sân.
/// </summary>
/// <param name="BranchId">ID chi nhánh</param>
/// <param name="FromDate">Ngày bắt đầu</param>
/// <param name="ToDate">Ngày kết thúc</param>
public sealed record GetFromTimeBookingQuery(
    Guid BranchId,
    DateOnly FromDate,
    DateOnly ToDate) : IQuery<TimeBookingScheduleDto>;
