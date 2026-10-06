namespace CourtBooking.Domain.Enums;

/// <summary>
/// 0 = PendingApproval, 1 = PendingPayment, 2 = Confirmed, 3 = Rejected, 4 = Cancelled, 5 = Expired
/// </summary>
public enum ParticipantStatus
{
    PendingApproval = 0,
    Confirmed = 1,
    Rejected = 2,
    Cancelled = 3
}
