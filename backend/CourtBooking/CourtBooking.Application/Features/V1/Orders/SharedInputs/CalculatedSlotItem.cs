namespace CourtBooking.Application.Features.V1.Orders.SharedInputs;

/// <summary>
/// Thông tin slot sân kèm giá đã tính toán.
/// </summary>
public sealed record CalculatedSlotItem(
    Guid CourtId,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal Price,
    DateOnly Date);
