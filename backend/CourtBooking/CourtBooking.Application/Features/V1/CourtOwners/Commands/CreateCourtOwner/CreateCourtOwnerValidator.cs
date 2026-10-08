using FluentValidation;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.CreateCourtOwner;

public sealed class CreateCourtOwnerValidator : AbstractValidator<CreateCourtOwnerCommand>
{
    public CreateCourtOwnerValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(200).WithMessage("Họ và tên không được vượt quá 200 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches(@"^(0|\+84)[3|5|7|8|9][0-9]{8}$").WithMessage("Số điện thoại không đúng định dạng Việt Nam.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Địa chỉ Email không hợp lệ.")
            .MaximumLength(256).WithMessage("Email không được vượt quá 256 ký tự.");

        When(x => !string.IsNullOrEmpty(x.Password), () =>
        {
            RuleFor(x => x.Password)
                .MinimumLength(6).WithMessage("Mật khẩu khởi tạo phải có ít nhất 6 ký tự.");
        });
    }
}
