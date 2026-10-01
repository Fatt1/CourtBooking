using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderOnline;

/// <summary>
/// Command đặt lịch sân online.
/// Lưu ý: Giá sân và giá dịch vụ không truyền từ client mà sẽ được tính toán trực tiếp ở Handler dựa trên cấu hình bảng giá và chi nhánh.
/// </summary>
public sealed record CreateOrderOnlineCommand(
    Guid BranchId,
    string CustomerName,
    string CustomerPhone,
    string? Note,
    List<CourtBookingSlot> CourtSlots,
    List<OrderServiceItem>? Services = null,
    Guid? PlayerId = null) : ICommand<CreateOrderOnlineResponse>;

/// <summary>
/// Kết quả trả về sau khi tạo đơn đặt sân online thành công.
/// </summary>
public sealed record CreateOrderOnlineResponse(
    string QrCodeImageKey,
    Guid OrderId,
    string OrderCode,
    decimal TotalAmount,
    DateTime HoldExpiresAt);
