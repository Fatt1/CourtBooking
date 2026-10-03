using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.CancelEvent;

/// <summary>
/// Command hủy sự kiện, hủy Order liên kết (giải phóng slot sân trên Time Grid) và hủy các vé đã đặt.
/// </summary>
public sealed record CancelEventCommand(
    Guid EventId,
    string Reason) : ICommand;
