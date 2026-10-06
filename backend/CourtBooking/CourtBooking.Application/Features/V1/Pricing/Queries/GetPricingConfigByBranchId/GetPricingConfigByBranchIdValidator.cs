using FluentValidation;

namespace CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByBranchId;

public sealed class GetPricingConfigByBranchIdValidator : AbstractValidator<GetPricingConfigByBranchIdQuery>
{
    public GetPricingConfigByBranchIdValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("BranchId không được để trống.");
    }
}
