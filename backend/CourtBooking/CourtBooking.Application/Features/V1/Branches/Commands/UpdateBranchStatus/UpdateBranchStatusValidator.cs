using FluentValidation;

namespace CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranchStatus;

public sealed class UpdateBranchStatusValidator : AbstractValidator<UpdateBranchStatusCommand>
{
    public UpdateBranchStatusValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Branch ID is required.");
    }
}
