using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CreateFixedOrderByOwner;

/// <summary>
/// Command dành cho chủ sân / quản lý đặt lịch cố định cho khách hàng.
/// </summary>
/// <param name="BranchId">ID chi nhánh</param>
/// <param name="CustomerName">Tên khách hàng</param>
/// <param name="CustomerPhone">Số điện thoại liên hệ</param>
/// <param name="Note">Ghi chú đơn đặt</param>
/// <param name="DiscountAmount">Số tiền giảm giá (mặc định = 0)</param>
/// <param name="PaymentMethod">Phương thức thanh toán (Tiền mặt, Chuyển khoản,...)</param>
/// <param name="Cycles">Danh sách các chu kì đặt sân cố định</param>
/// <param name="Services">Danh sách dịch vụ đi kèm (nếu có)</param>
public sealed record CreateFixedOrderByOwnerCommand(
    Guid BranchId,
    string CustomerName,
    string CustomerPhone,
    string? Note,
    decimal DiscountAmount,
    PaymentMethod PaymentMethod,
    List<FixedCycleInput> Cycles,
    List<OrderServiceItem>? Services = null) : ICommand<Guid>;
