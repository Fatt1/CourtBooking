using FluentValidation;

namespace CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByCourtType;

public sealed class GetPricingConfigByCourtTypeValidator : AbstractValidator<GetPricingConfigByCourtTypeQuery>
{
    public GetPricingConfigByCourtTypeValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("BranchId không được để trống.");

        RuleFor(x => x.CourtTypeId)
            .NotEmpty().WithMessage("CourtTypeId không được để trống.");
    }
}
