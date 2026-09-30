using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.UpdatePriceTable;

/// <summary>
/// Lệnh cập nhật thông tin bảng giá.
/// </summary>
public sealed record UpdatePriceTableCommand(
    Guid BranchId,
    Guid PriceTableId,
    string Name,
    decimal DefaultPrice,
    bool IsActive) : ICommand;
