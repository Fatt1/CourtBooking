using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.CreateOrderOnline;

/// <summary>
/// Command đặt lịch sân online.
/// Lưu ý: Giá sân và giá dịch vụ không truyền từ client mà sẽ được tính toán trực tiếp ở Handler dựa trên cấu hình bảng giá và chi nhánh.
/// </summary>
public sealed record CreateOrderOnlineCommand(
    Guid BranchId,
    string CustomerName,
    string CustomerPhone,
    string? Note,
    List<CourtBookingSlotDto> CourtSlots,
    List<OrderServiceItemDto>? Services = null,
    Guid? PlayerId = null) : ICommand<CreateOrderOnlineResponse>;

/// <summary>
/// Nhóm đặt sân theo Loại sân (CourtType) và Bảng giá (PriceTable) áp dụng.
/// </summary>
public sealed record CourtBookingSlotDto(
    Guid CourtTypeId,
    Guid PriceTableId,
    List<CourtSlotItemDto> Slots);

/// <summary>
/// Thông tin sân cụ thể và khung giờ đặt.
/// </summary>
public sealed record CourtSlotItemDto(
    Guid CourtId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime);

/// <summary>
/// Thông tin dịch vụ đính kèm và số lượng.
/// </summary>
public sealed record OrderServiceItemDto(
    Guid ServiceId,
    int Quantity);

/// <summary>
/// Kết quả trả về sau khi tạo đơn đặt sân online thành công.
/// </summary>
public sealed record CreateOrderOnlineResponse(
    string QrCodeImageKey,
    Guid OrderId,
    string OrderCode,
    decimal TotalAmount,
    DateTime HoldExpiresAt);
