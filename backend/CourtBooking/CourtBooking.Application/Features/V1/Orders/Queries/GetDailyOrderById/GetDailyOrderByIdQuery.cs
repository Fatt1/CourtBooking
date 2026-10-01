using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetDailyOrderById;

public sealed record GetDailyOrderByIdQuery(
    Guid OrderId
    ) : IQuery<DailyOrderResponse>;



/// <summary>
/// Chi tiết toàn diện của một đơn đặt sân hằng ngày (vãng lai / thường).
/// </summary>
public sealed record DailyOrderResponse(
    // 1. Thông tin chung đơn hàng
    Guid Id,
    string OrderCode,
    Guid BranchId,
    string BranchName,
    OrderChannel Channel,             // Online hay Pos (tại quầy)
    OrderStatus Status,
    OrderType OrderType,
    DateOnly OrderDate,
    DateTime CreatedAt,
    DateTime? HoldExpiresAt,          // Hạn giữ chỗ nếu đang AwaitingPayment
    string? Note,
    string? CancelReason,
    // 2. Thông tin khách hàng
    string CustomerName,
    string CustomerPhone,
    Guid? PlayerId,
    // 3. Chi tiết các ca đặt sân (Kèm giá tiền từng ca để in hóa đơn)
    List<DailyOrderSlotItemDto> Slots,
    // 4. Chi tiết các dịch vụ đính kèm
    List<DailyOrderServiceItemDto> Services,
    // 5. Chiết tính hóa đơn & Thanh toán
    decimal TotalCourtAmount,          // Tổng tiền sân
    decimal TotalServiceAmount,        // Tổng tiền dịch vụ
    decimal DiscountAmount,            // Số tiền giảm giá
    decimal TotalAmount,               // Tổng cộng phải trả (Sân + Dịch vụ - Giảm giá)
    decimal RemainingAmount);     // Còn phải thanh toán

/// <summary>
/// Chi tiết từng ca chơi trong đơn hàng.
/// </summary>
public sealed record DailyOrderSlotItemDto(
    Guid OrderDetailId,
    Guid CourtId,
    string CourtName,
    Guid CourTypeId,
    string CourtTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal Price);                    // Đơn chi tiết bắt buộc cần Price để đối soát/in hóa đơn
/// <summary>
/// Chi tiết từng dịch vụ đính kèm.
/// </summary>
public sealed record DailyOrderServiceItemDto(
    Guid ServiceId,
    string ServiceName,
    string? Unit,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice);
