namespace CourtBooking.Domain.Enums;

/// <summary>
/// 0 = Normal booking, 1 = Fixed booking, 2 = Event, 3 = Social match (giao lưu)
/// </summary>
public enum OrderType
{
    Normal = 0,
    Fixed = 1,
    Event = 2,
    SocialMatch = 3
}
