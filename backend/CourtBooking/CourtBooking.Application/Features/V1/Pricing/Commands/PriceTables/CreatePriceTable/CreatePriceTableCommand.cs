using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.CreatePriceTable;

/// <summary>
/// Lệnh tạo mới bảng giá cho Loại sân thuộc Chi nhánh.
/// </summary>
public sealed record CreatePriceTableCommand(
    Guid BranchId,
    Guid CourtTypeId,
    string Name,
    decimal DefaultPrice,
    bool IsActive) : ICommand<Guid>;
