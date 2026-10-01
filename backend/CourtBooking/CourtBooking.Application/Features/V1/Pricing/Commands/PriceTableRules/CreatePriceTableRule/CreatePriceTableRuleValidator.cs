using FluentValidation;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.CreatePriceTableRule;

public sealed class CreatePriceTableRuleValidator : AbstractValidator<CreatePriceTableRuleCommand>
{
    public CreatePriceTableRuleValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("BranchId không được để trống.");

        RuleFor(x => x.PriceTableId)
            .NotEmpty().WithMessage("PriceTableId không được để trống.");

        RuleFor(x => x.DayOfWeekFrom)
            .InclusiveBetween((byte)0, (byte)6)
            .WithMessage("Thứ bắt đầu (DayOfWeekFrom) phải từ 0 (Chủ nhật) đến 6 (Thứ bảy).");

        RuleFor(x => x.DayOfWeekTo)
            .InclusiveBetween((byte)0, (byte)6)
            .WithMessage("Thứ kết thúc (DayOfWeekTo) phải từ 0 (Chủ nhật) đến 6 (Thứ bảy).");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("Giờ kết thúc phải lớn hơn giờ bắt đầu.");

        RuleFor(x => x.FixedCustomerPrice)
            .GreaterThan(0)
            .WithMessage("Đơn giá khách cố định phải lớn hơn 0.");

        RuleFor(x => x.WalkInCustomerPrice)
            .GreaterThan(0)
            .WithMessage("Đơn giá khách vãng lai phải lớn hơn 0.");

        When(x => x.StartDate.HasValue && x.EndDate.HasValue, () =>
        {
            RuleFor(x => x.EndDate!.Value)
                .GreaterThanOrEqualTo(x => x.StartDate!.Value)
                .WithMessage("Ngày kết thúc hiệu lực phải sau hoặc cùng ngày với ngày bắt đầu.");
        });
    }
}
