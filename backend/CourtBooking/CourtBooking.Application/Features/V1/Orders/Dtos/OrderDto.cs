using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Dtos;

/// <summary>
/// DTO danh sách đơn hàng 
/// </summary>
public sealed record OrderDto(
    Guid Id,
    string OrderCode,
    string CustomerName,
    string CustomerPhone,
    OrderStatus Status,
    OrderType OrderType,
    DateOnly OrderDate,
    decimal TotalAmount,
    string? Note,
    List<OrderDetailDto> Details);
