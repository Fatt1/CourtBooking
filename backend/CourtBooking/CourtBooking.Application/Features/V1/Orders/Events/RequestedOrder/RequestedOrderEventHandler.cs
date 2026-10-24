using CourtBooking.Application.Abstractions.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Application.Features.V1.Orders.Events.RequestedOrder;

public sealed class RequestedOrderEventHandler(
    INotificationService notificationService,
    ILogger<RequestedOrderEventHandler> logger) : INotificationHandler<RequestedOrderEvent>
{
    public async Task Handle(RequestedOrderEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Triggering real-time notification for RequestedOrder {OrderCode} at Branch {BranchId}",
            notification.OrderCode,
            notification.BranchId);

        var payload = new
        {
            Type = "ORDER",
            Id = notification.OrderId,
            OrderId = notification.OrderId,
            OrderCode = notification.OrderCode,
            BranchId = notification.BranchId,
            BranchName = notification.BranchName,
            CustomerName = notification.CustomerName,
            CustomerPhone = notification.CustomerPhone,
            TotalAmount = notification.TotalAmount,
            Title = "Đơn đặt sân mới cần duyệt",
            Message = $"[{notification.BranchName}] Khách hàng {notification.CustomerName} vừa gửi thanh toán cho đơn {notification.OrderCode}",
            CreatedAt = notification.CreatedAt
        };

        // Chỉ gửi tới toàn bộ cho chủ sân (Owner)
        await notificationService.SendToOwnerAsync(notification.CourtOwnerId, "ReceiveNotification", payload, cancellationToken);
    }
}
