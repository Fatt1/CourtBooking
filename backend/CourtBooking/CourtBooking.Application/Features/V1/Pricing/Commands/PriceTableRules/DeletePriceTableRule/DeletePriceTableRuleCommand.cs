using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.DeletePriceTableRule;

/// <summary>
/// Lệnh xóa quy tắc tính giá khỏi bảng giá.
/// </summary>
public sealed record DeletePriceTableRuleCommand(
    Guid BranchId,
    Guid PriceTableId,
    Guid RuleId) : ICommand;
