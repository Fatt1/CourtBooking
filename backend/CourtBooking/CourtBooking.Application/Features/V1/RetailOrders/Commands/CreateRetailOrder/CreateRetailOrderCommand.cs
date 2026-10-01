using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.RetailOrders.Commands.CreateRetailOrder;

public sealed record CreateRetailOrderItem(Guid ServiceId, int Quantity);

public sealed record CreateRetailOrderCommand(
    Guid BranchId,
    decimal DiscountAmount,
    PaymentMethod PaymentMethod,
    string? CustomerName,
    IReadOnlyList<CreateRetailOrderItem> Items) : ICommand<RetailOrderDto>;
