using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Dtos;

public sealed record PaymentTransactionDto(
    Guid Id,
    decimal Amount,
    PaymentMethod PaymentMethod,
    DateTime CreatedAt,
    PaymentTransactionType Type,
    string? ImageKey

);
