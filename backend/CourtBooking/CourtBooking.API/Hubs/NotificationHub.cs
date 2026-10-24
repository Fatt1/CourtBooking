using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace CourtBooking.API.Hubs;

public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? Context.User?.FindFirst("sub")?.Value
                     ?? Context.User?.FindFirst("userId")?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"owner_{userId}");
            _logger.LogInformation("SignalR client {ConnectionId} auto-joined group owner_{UserId}", Context.ConnectionId, userId);
        }

        // Hỗ trợ truyền branchId qua Query string khi connect
        var branchId = httpContext?.Request.Query["branchId"].ToString();
        if (!string.IsNullOrEmpty(branchId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"branch_{branchId}");
            _logger.LogInformation("SignalR client {ConnectionId} auto-joined group branch_{BranchId}", Context.ConnectionId, branchId);
        }

        // Hỗ trợ truyền ownerId qua Query string khi connect
        var ownerIdQuery = httpContext?.Request.Query["ownerId"].ToString();
        if (!string.IsNullOrEmpty(ownerIdQuery))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"owner_{ownerIdQuery}");
            _logger.LogInformation("SignalR client {ConnectionId} auto-joined group owner_{OwnerIdQuery}", Context.ConnectionId, ownerIdQuery);
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinBranchGroup(string branchId)
    {
        if (!string.IsNullOrWhiteSpace(branchId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"branch_{branchId}");
            _logger.LogInformation("Client {ConnectionId} explicitly joined group branch_{BranchId}", Context.ConnectionId, branchId);
        }
    }

    public async Task LeaveBranchGroup(string branchId)
    {
        if (!string.IsNullOrWhiteSpace(branchId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"branch_{branchId}");
            _logger.LogInformation("Client {ConnectionId} left group branch_{BranchId}", Context.ConnectionId, branchId);
        }
    }

    public async Task JoinOwnerGroup(string ownerId)
    {
        if (!string.IsNullOrWhiteSpace(ownerId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"owner_{ownerId}");
            _logger.LogInformation("Client {ConnectionId} explicitly joined group owner_{OwnerId}", Context.ConnectionId, ownerId);
        }
    }
}
