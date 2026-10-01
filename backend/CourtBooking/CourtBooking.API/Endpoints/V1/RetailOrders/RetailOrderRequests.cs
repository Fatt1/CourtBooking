using CourtBooking.Domain.Enums;

namespace CourtBooking.API.Endpoints.V1.RetailOrders;

public sealed record CreateRetailOrderItemRequest(Guid ServiceId, int Quantity);

public sealed record CreateRetailOrderRequest(
    Guid BranchId,
    decimal DiscountAmount,
    PaymentMethod PaymentMethod,
    string? CustomerName,
    IReadOnlyList<CreateRetailOrderItemRequest> Items);
