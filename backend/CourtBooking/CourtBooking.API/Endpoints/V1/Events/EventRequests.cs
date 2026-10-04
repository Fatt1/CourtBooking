using CourtBooking.Domain.Enums;

namespace CourtBooking.API.Endpoints.V1.Events;

/// <summary>
/// Request gửi lên khi người chơi đặt mua vé sự kiện.
/// </summary>
public sealed record BookEventTicketRequest(
    int Quantity,
    PaymentMethod PaymentMethod,
    Guid? ProofImageId = null);
