namespace CourtBooking.Application.Features.V1.Orders.SharedInputs;

/// <summary>
/// Đối tượng làm phẳng thông tin của một slot sân để phục vụ kiểm tra và xử lý.
/// </summary>
public sealed record FlatSlotItem(
    Guid CourtTypeId,
    Guid PriceTableId,
    Guid CourtId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime);
