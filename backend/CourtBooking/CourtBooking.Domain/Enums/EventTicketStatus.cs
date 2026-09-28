namespace CourtBooking.Domain.Enums;

/// <summary>
/// 0 = PendingApproval, 1 = Confirmed, 2 = Refunded, 3 = Cancelled
/// </summary>
public enum EventTicketStatus
{
    PendingApproval = 0,
    Confirmed = 1,
    Cancelled = 2,
    RequestCancellation = 3,
}
