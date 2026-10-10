using FluentValidation;

namespace CourtBooking.Application.Features.V1.Users.Commands.UpdateUserStatus;

public sealed class UpdateUserStatusValidator : AbstractValidator<UpdateUserStatusCommand>
{
    public UpdateUserStatusValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId không được để trống.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái người dùng không hợp lệ.");
    }
}
