using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderByOwner;

/// <summary>
/// Command chủ sân hủy đơn hàng kèm lý do và số tiền hoàn nếu có.
/// </summary>
public sealed record CancelOrderByOwnerCommand(
    Guid OrderId,
    string CancelReason,
    decimal? RefundAmount = null,
    PaymentMethod? RefundMethod = null) : ICommand;
