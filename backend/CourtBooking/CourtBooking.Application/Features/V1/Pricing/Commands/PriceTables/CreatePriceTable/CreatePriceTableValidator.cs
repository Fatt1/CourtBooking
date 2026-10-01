using FluentValidation;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.CreatePriceTable;

public sealed class CreatePriceTableValidator : AbstractValidator<CreatePriceTableCommand>
{
    public CreatePriceTableValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("BranchId không được để trống.");

        RuleFor(x => x.CourtTypeId)
            .NotEmpty().WithMessage("CourtTypeId không được để trống.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên bảng giá không được để trống.")
            .MaximumLength(255).WithMessage("Tên bảng giá không được vượt quá 255 ký tự.");

        RuleFor(x => x.DefaultPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Giá mặc định không được âm.");
    }
}
