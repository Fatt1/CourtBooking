namespace CourtBooking.Application.Features.V1.RetailOrders.Dtos;

public sealed record RetailOrderItemDto(
    Guid ServiceId,
    string ServiceName,
    string Unit,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record RetailOrderDto(
    Guid Id,
    Guid BranchId,
    string BranchName,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TotalAmount,
    DateOnly OrderDate,
    DateTime CreatedAt,
    IReadOnlyList<RetailOrderItemDto> Items);

public sealed record RetailOrderListItemDto(
    Guid Id,
    Guid BranchId,
    string BranchName,
    int TotalQuantity,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TotalAmount,
    DateOnly OrderDate,
    DateTime CreatedAt);

public sealed record RetailOrderSummaryDto(
    int TotalOrders,
    int TotalItems,
    decimal GrossRevenue,
    decimal TotalDiscount,
    decimal NetRevenue);
