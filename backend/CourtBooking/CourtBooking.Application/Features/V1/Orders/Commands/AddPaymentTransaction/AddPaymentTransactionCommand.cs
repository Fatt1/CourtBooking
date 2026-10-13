using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddPaymentTransaction;

/// <summary>
/// Command thu thêm tiền hoặc hoàn tiền (giao dịch) cho một đơn hàng.
/// </summary>
public sealed record AddPaymentTransactionCommand(
    Guid OrderId,
    decimal Amount,
    PaymentMethod Method,
    PaymentTransactionType Type = PaymentTransactionType.Payment,
    Guid? ProofImageId = null) : ICommand<Guid>;
