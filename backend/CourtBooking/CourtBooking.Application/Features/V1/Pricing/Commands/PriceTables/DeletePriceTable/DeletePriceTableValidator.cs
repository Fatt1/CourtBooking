using FluentValidation;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.DeletePriceTable;

public sealed class DeletePriceTableValidator : AbstractValidator<DeletePriceTableCommand>
{
    public DeletePriceTableValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("BranchId không được để trống.");

        RuleFor(x => x.PriceTableId)
            .NotEmpty().WithMessage("PriceTableId không được để trống.");
    }
}
