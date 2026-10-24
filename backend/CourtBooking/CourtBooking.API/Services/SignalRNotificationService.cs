using CourtBooking.API.Hubs;
using CourtBooking.Application.Abstractions.Notifications;
using Microsoft.AspNetCore.SignalR;

namespace CourtBooking.API.Services;

public class SignalRNotificationService(
    IHubContext<NotificationHub> hubContext,
    ILogger<SignalRNotificationService> logger) : INotificationService
{
    public async Task SendToOwnerAsync(Guid courtOwnerId, string eventName, object payload, CancellationToken cancellationToken = default)
    {
        try
        {
            await hubContext.Clients.Group($"owner_{courtOwnerId}").SendAsync(eventName, payload, cancellationToken);
            logger.LogInformation("Sent SignalR event {EventName} to owner group owner_{OwnerId}", eventName, courtOwnerId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send SignalR event {EventName} to owner {OwnerId}", eventName, courtOwnerId);
        }
    }

    public async Task SendToBranchAsync(Guid branchId, string eventName, object payload, CancellationToken cancellationToken = default)
    {
        try
        {
            await hubContext.Clients.Group($"branch_{branchId}").SendAsync(eventName, payload, cancellationToken);
            logger.LogInformation("Sent SignalR event {EventName} to branch group branch_{BranchId}", eventName, branchId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send SignalR event {EventName} to branch {BranchId}", eventName, branchId);
        }
    }
}
