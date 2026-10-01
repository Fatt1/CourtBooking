using FluentValidation;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.DeleteFixedTimeBlock;

public sealed class DeleteFixedTimeBlockValidator : AbstractValidator<DeleteFixedTimeBlockCommand>
{
    public DeleteFixedTimeBlockValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("BranchId không được để trống.");

        RuleFor(x => x.BlockId)
            .NotEmpty().WithMessage("BlockId không được để trống.");
    }
}
