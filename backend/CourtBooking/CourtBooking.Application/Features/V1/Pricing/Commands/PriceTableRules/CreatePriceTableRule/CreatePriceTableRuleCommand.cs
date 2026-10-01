using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.CreatePriceTableRule;

/// <summary>
/// Lệnh thêm quy tắc tính giá mới vào bảng giá.
/// </summary>
public sealed record CreatePriceTableRuleCommand(
    Guid BranchId,
    Guid PriceTableId,
    DateOnly? StartDate,
    DateOnly? EndDate,
    byte DayOfWeekFrom,
    byte DayOfWeekTo,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal FixedCustomerPrice,
    decimal WalkInCustomerPrice) : ICommand<Guid>;
