namespace CourtBooking.Application.Features.V1.Orders.Dtos;

/// <summary>
/// Chi tiết slot sân trong đơn hàng vãng lai.
/// </summary>
public sealed record OrderDetailDto(
    Guid CourtId,
    string CourtName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime);
