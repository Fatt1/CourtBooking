using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.CreateFixedTimeBlock;

/// <summary>
/// Lệnh tạo mới khung giờ bắt buộc (Fixed Time Block) gắn liền với danh sách sân áp dụng.
/// </summary>
public sealed record CreateFixedTimeBlockCommand(
    Guid BranchId,
    Guid CourtTypeId,
    TimeOnly StartTime,
    TimeOnly EndTime,
    List<int> DaysOfWeek,
    List<Guid> CourtIds) : ICommand<Guid>;
