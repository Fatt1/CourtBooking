using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderByOwner;

/// <summary>
/// Command dành cho chủ sân / nhân viên đặt lịch trực tiếp cho khách vãng lai tại quầy
/// </summary>
/// <param name="BranchId">ID chi nhánh</param>
/// <param name="CustomerName">Tên khách hàng</param>
/// <param name="CustomerPhone">Số điện thoại liên hệ</param>
/// <param name="Note">Ghi chú đơn đặt</param>
/// <param name="DiscountAmount">Số tiền giảm giá (mặc định = 0)</param>
/// <param name="CourtSlots">Danh sách nhóm đặt sân kèm bảng giá</param>
/// <param name="Services">Danh sách dịch vụ đi kèm (nếu có)</param>
/// <param name="PlayerId">ID khách hàng nếu đã có tài khoản trên hệ thống</param>
public sealed record CreateOrderByOwnerCommand(
    Guid BranchId,
    string CustomerName,
    string CustomerPhone,
    string? Note,
    decimal DiscountAmount,
    PaymentMethod PaymentMethod,
    List<CourtBookingSlot> CourtSlots,
    List<OrderServiceItem>? Services = null,
    Guid? PlayerId = null) : ICommand<Guid>;
