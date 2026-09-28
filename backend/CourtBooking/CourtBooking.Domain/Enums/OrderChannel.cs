namespace CourtBooking.Domain.Enums;

/// <summary>
/// 0 = Player online, 1 = Walk-in (offline), 2 = CourtOwner tạo, 3 = CourtOwner tạo (giao lưu)
/// </summary>
public enum OrderChannel
{
    PlayerOnline = 0,
    WalkIn = 1,
    CourtOwnerCreated = 2,
    CourtOwnerSocialMatch = 3
}
