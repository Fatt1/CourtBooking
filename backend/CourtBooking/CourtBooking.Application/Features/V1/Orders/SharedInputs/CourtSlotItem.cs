namespace CourtBooking.Application.Features.V1.Orders.SharedInputs;

/// <summary>
/// Thông tin sân cụ thể và khung giờ đặt.
/// </summary>
public sealed record CourtSlotItem(
    Guid CourtId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime);
