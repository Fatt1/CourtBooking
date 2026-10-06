using FluentValidation;

namespace CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourt;

public sealed class UpdateCourtValidator : AbstractValidator<UpdateCourtCommand>
{
    public UpdateCourtValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Court ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Court name is required.")
            .MaximumLength(255).WithMessage("Court name must not exceed 255 characters.");

        When(x => x.CourtTypeId.HasValue, () =>
        {
            RuleFor(x => x.CourtTypeId!.Value)
                .NotEmpty().WithMessage("CourtTypeId must not be empty if provided.");
        });
    }
}
