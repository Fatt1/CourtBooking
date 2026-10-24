namespace CourtBooking.Domain.Enums;

/// <summary>
/// 0 = AwaitingPayment, 1 = PendingApproval, 2 = Confirmed, 3 = Cancelled
/// </summary>
public enum EventTicketStatus
{
    AwaitingPayment = 0,
    PendingApproval = 1,
    Confirmed = 2,
    Cancelled = 3,
}
