using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderServices;

/// <summary>
/// Command cập nhật lại toàn bộ danh sách dịch vụ của một đơn hàng.
/// </summary>
public sealed record UpdateOrderServicesCommand(
    Guid OrderId,
    List<OrderServiceItem>? Services = null) : ICommand;
