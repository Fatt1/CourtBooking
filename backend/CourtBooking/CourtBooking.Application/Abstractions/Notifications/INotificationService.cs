namespace CourtBooking.Application.Abstractions.Notifications;

public interface INotificationService
{
    Task SendToOwnerAsync(Guid courtOwnerId, string eventName, object payload, CancellationToken cancellationToken = default);
    Task SendToBranchAsync(Guid branchId, string eventName, object payload, CancellationToken cancellationToken = default);
}
