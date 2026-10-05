using CourtBooking.Domain.Enums;
using FluentValidation;

namespace CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourtStatus;

public sealed class UpdateCourtStatusValidator : AbstractValidator<UpdateCourtStatusCommand>
{
    public UpdateCourtStatusValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Court ID is required.");

        RuleFor(x => x.Status)
            .Must(s => s == CourtStatus.Available || s == CourtStatus.Maintenance)
            .WithMessage("Court status must be either Available (1) or Maintenance (2).");
    }
}
