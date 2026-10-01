using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.DeletePriceTable;

/// <summary>
/// Lệnh xóa bảng giá.
/// </summary>
public sealed record DeletePriceTableCommand(
    Guid BranchId,
    Guid PriceTableId) : ICommand;
