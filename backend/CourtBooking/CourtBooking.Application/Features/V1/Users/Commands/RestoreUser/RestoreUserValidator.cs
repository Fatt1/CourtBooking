using FluentValidation;

namespace CourtBooking.Application.Features.V1.Users.Commands.RestoreUser;

public sealed class RestoreUserValidator : AbstractValidator<RestoreUserCommand>
{
    public RestoreUserValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId không được để trống.");
    }
}
