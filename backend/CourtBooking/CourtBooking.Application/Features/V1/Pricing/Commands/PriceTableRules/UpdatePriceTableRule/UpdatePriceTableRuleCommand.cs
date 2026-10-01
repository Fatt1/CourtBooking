using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.UpdatePriceTableRule;

/// <summary>
/// Lệnh cập nhật quy tắc tính giá trong bảng giá.
/// </summary>
public sealed record UpdatePriceTableRuleCommand(
    Guid BranchId,
    Guid PriceTableId,
    Guid RuleId,
    DateOnly? StartDate,
    DateOnly? EndDate,
    byte DayOfWeekFrom,
    byte DayOfWeekTo,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal FixedCustomerPrice,
    decimal WalkInCustomerPrice) : ICommand;
