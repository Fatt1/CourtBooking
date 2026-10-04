using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddPaymentTransaction;

/// <summary>
/// Command thu thêm tiền cho một đơn hàng.
/// </summary>
public sealed record AddPaymentTransactionCommand(
    Guid OrderId,
    decimal Amount,
    PaymentMethod Method,
    Guid? ProofImageId = null) : ICommand<Guid>;
