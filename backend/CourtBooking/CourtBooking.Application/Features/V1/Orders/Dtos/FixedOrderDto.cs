using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Dtos;

/// <summary>
/// DTO danh sách đơn hàng lịch cố định cho chủ sân.
/// </summary>
public sealed record FixedOrderDto(
    Guid Id,
    string OrderCode,
    string CustomerName,
    string CustomerPhone,
    OrderStatus Status,
    OrderType OrderType,
    DateOnly OrderDate,
    decimal TotalAmount,
    decimal TotalCourtAmount,
    decimal TotalServiceAmount,
    decimal RemainingAmount,
    decimal DiscountAmount,
    string? Note,
    DateTime CreatedAt,
    List<FixedOrderCycleSummaryDto> Cycles);

/// <summary>
/// DTO tóm tắt chu kì của đơn lịch cố định (chỉ gồm ngày bắt đầu và kết thúc của chu kì).
/// </summary>
public sealed record FixedOrderCycleSummaryDto(
    TimeOnly StartTime,
    TimeOnly EndTime,
    Guid CycleId,
    DateOnly StartDate,
    DateOnly EndDate);
