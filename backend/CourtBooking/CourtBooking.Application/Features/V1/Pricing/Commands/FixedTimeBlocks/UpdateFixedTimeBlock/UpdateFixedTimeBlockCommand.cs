using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.UpdateFixedTimeBlock;

/// <summary>
/// Lệnh cập nhật khung giờ bắt buộc (Fixed Time Block) kèm danh sách sân áp dụng.
/// </summary>
public sealed record UpdateFixedTimeBlockCommand(
    Guid BranchId,
    Guid BlockId,
    TimeOnly StartTime,
    TimeOnly EndTime,
    List<int> DaysOfWeek,
    List<Guid> CourtIds) : ICommand;
