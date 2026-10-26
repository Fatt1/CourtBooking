using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.RejectOrderCancellation;

/// <summary>
/// Command chủ sân từ chối yêu cầu hủy đơn, chuyển trạng thái đơn trở lại Confirmed (Đã nhận / Đã xác nhận).
/// </summary>
public sealed record RejectOrderCancellationCommand(
    Guid OrderId,
    string? RejectionReason = null) : ICommand;
