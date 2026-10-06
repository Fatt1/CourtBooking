using FluentValidation;

namespace CourtBooking.Application.Features.V1.Courts.Commands.CreateCourt;

public sealed class CreateCourtValidator : AbstractValidator<CreateCourtCommand>
{
    public CreateCourtValidator()
    {
        RuleFor(x => x.CourtTypeId)
            .NotEmpty().WithMessage("CourtTypeId is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Court name is required.")
            .MaximumLength(255).WithMessage("Court name must not exceed 255 characters.");
    }
}

