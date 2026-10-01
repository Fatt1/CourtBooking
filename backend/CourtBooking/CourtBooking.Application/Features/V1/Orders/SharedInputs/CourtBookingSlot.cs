namespace CourtBooking.Application.Features.V1.Orders.SharedInputs;

/// <summary>
/// Nhóm đặt sân theo Loại sân (CourtType) và Bảng giá (PriceTable) áp dụng.
/// </summary>
public sealed record CourtBookingSlot(
    Guid CourtTypeId,
    Guid PriceTableId,
    List<CourtSlotItem> Slots);
