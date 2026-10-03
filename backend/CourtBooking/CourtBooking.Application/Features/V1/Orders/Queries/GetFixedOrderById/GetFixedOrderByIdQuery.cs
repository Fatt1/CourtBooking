using CourtBooking.Application.Features.V1.Orders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetFixedOrderById;

public sealed record GetFixedOrderByIdQuery(Guid OrderId) : IQuery<FixedOrderResponse>;

/// <summary>
/// Chi tiết toàn diện của một đơn đặt sân lịch cố định.
/// </summary>
public sealed record FixedOrderResponse(
    // 1. Thông tin chung đơn hàng
    Guid Id,
    string OrderCode,
    Guid BranchId,
    string BranchName,
    OrderChannel Channel,
    OrderStatus Status,
    OrderType OrderType,
    DateOnly OrderDate,
    DateTime CreatedAt,
    string? Note,
    string? CancelReason,
    // 2. Thông tin khách hàng
    string CustomerName,
    string CustomerPhone,
    Guid? PlayerId,
    // 3. Danh sách chu kì cấu hình
    List<FixedCycleDetailDto> Cycles,
    // 4. Danh sách các ca/buổi đặt sân thực tế sinh ra
    List<FixedOrderSlotDto> Slots,
    // 5. Dịch vụ đính kèm
    List<FixedOrderServiceDto> Services,
    // 6. Chiết tính thanh toán
    decimal TotalCourtAmount,
    decimal TotalServiceAmount,
    decimal DiscountAmount,
    decimal TotalAmount,
    decimal RemainingAmount,
    List<PaymentTransactionDto> PaymentTransactions);

public sealed record FixedCycleDetailDto(
    Guid CycleId,
    Guid CourtTypeId,
    string CourtTypeName,
    DateOnly StartDate,
    DateOnly EndDate,
    int DaysOfWeekMask,
    List<int> DaysOfWeek,
    List<string> DayNames,
    TimeOnly StartTime,
    TimeOnly EndTime,
    List<DateOnly> ExceptionDates,
    List<FixedCycleCourtItemDto> Courts);

public sealed record FixedCycleCourtItemDto(
    Guid CourtId,
    string CourtName);

public sealed record FixedOrderSlotDto(
    Guid OrderDetailId,
    Guid CourtId,
    string CourtName,
    Guid CourtTypeId,
    string CourtTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal Price);

public sealed record FixedOrderServiceDto(
    Guid ServiceId,
    string ServiceName,
    string? Unit,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice);

public sealed record FixedOrderPaymentTransactionDto(
    Guid Id,
    decimal Amount,
    PaymentMethod Method,
    PaymentTransactionType Type,
    DateTime CreatedAt);
