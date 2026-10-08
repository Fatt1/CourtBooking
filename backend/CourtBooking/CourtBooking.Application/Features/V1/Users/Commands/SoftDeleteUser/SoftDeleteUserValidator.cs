using FluentValidation;

namespace CourtBooking.Application.Features.V1.Users.Commands.SoftDeleteUser;

public sealed class SoftDeleteUserValidator : AbstractValidator<SoftDeleteUserCommand>
{
    public SoftDeleteUserValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId không được để trống.");
    }
}
