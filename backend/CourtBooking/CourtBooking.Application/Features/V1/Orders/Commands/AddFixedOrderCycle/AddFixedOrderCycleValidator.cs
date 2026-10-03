using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddFixedOrderCycle;

public sealed class AddFixedOrderCycleValidator : AbstractValidator<AddFixedOrderCycleCommand>
{
    public AddFixedOrderCycleValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("OrderId không được để trống.");

        RuleFor(x => x.CourtTypeId)
            .NotEmpty().WithMessage("CourtTypeId không được để trống.");

        RuleFor(x => x.PriceTableId)
            .NotEmpty().WithMessage("PriceTableId không được để trống.");

        RuleFor(x => x.StartDate)
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.Date))
            .WithMessage("Ngày bắt đầu chu kì không thể ở trong quá khứ.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Ngày kết thúc chu kì phải lớn hơn hoặc bằng ngày bắt đầu.");

        RuleFor(x => x.DaysOfWeekMask)
            .InclusiveBetween(1, 127)
            .WithMessage("Bitmask thứ trong tuần không hợp lệ (phải từ 1 đến 127).");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("Giờ kết thúc phải sau giờ bắt đầu.");

        RuleFor(x => x.CourtIds)
            .NotEmpty().WithMessage("Chu kì phải chọn ít nhất một sân.");

        RuleForEach(x => x.CourtIds)
            .NotEmpty().WithMessage("CourtId không được để trống.");
    }
}
