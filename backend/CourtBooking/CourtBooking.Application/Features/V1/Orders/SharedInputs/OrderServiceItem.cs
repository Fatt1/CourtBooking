namespace CourtBooking.Application.Features.V1.Orders.SharedInputs;

/// <summary>
/// Thông tin dịch vụ đính kèm và số lượng.
/// </summary>
public sealed record OrderServiceItem(
    Guid ServiceId,
    int Quantity);
