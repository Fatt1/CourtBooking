using FluentValidation;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ChangePassword;

public sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Mật khẩu hiện tại không được để trống.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới không được để trống.")
            .MinimumLength(6).WithMessage("Mật khẩu mới phải có tối thiểu 6 ký tự.")
            .NotEqual(x => x.CurrentPassword).WithMessage("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
    }
}
