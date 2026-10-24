using CourtBooking.Application.Abstractions.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Application.Features.V1.Events.Events.RequestedEventTicket;

public sealed class RequestedEventTicketEventHandler(
    INotificationService notificationService,
    ILogger<RequestedEventTicketEventHandler> logger) : INotificationHandler<RequestedEventTicketEvent>
{
    public async Task Handle(RequestedEventTicketEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Triggering real-time notification for RequestedEventTicket on Event {EventTitle} at Branch {BranchId}",
            notification.EventTitle,
            notification.BranchId);

        var payload = new
        {
            Type = "EVENT_TICKET",
            Id = notification.TicketId,
            TicketId = notification.TicketId,
            EventId = notification.EventId,
            EventTitle = notification.EventTitle,
            BranchId = notification.BranchId,
            BranchName = notification.BranchName,
            PlayerName = notification.PlayerName,
            Quantity = notification.Quantity,
            TotalPrice = notification.TotalPrice,
            Title = "Vé tham gia sự kiện mới cần duyệt",
            Message = $"[{notification.BranchName}] Người chơi {notification.PlayerName} vừa gửi minh chứng mua {notification.Quantity} vé cho sự kiện \"{notification.EventTitle}\"",
            CreatedAt = notification.CreatedAt
        };

        // Chỉ gửi tới toàn bộ cho chủ sân (Owner)
        await notificationService.SendToOwnerAsync(notification.CourtOwnerId, "ReceiveNotification", payload, cancellationToken);
    }
}
