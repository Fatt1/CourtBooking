using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.RetailOrders.Commands.CreateRetailOrder;

public sealed record CreateRetailOrderItem(Guid ServiceId, int Quantity);

public sealed record CreateRetailOrderCommand(
    Guid BranchId,
    decimal DiscountAmount,
    IReadOnlyList<CreateRetailOrderItem> Items) : ICommand<RetailOrderDto>;
