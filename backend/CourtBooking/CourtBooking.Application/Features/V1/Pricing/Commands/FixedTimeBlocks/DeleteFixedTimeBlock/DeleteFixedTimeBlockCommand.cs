using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.DeleteFixedTimeBlock;

/// <summary>
/// Lệnh xóa khung giờ bắt buộc.
/// </summary>
public sealed record DeleteFixedTimeBlockCommand(
    Guid BranchId,
    Guid BlockId) : ICommand;
