using FluentValidation;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.DeletePriceTableRule;

public sealed class DeletePriceTableRuleValidator : AbstractValidator<DeletePriceTableRuleCommand>
{
    public DeletePriceTableRuleValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("BranchId không được để trống.");

        RuleFor(x => x.PriceTableId)
            .NotEmpty().WithMessage("PriceTableId không được để trống.");

        RuleFor(x => x.RuleId)
            .NotEmpty().WithMessage("RuleId không được để trống.");
    }
}
