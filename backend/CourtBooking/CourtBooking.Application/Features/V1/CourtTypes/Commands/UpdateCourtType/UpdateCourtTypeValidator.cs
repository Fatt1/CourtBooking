using FluentValidation;

namespace CourtBooking.Application.Features.V1.CourtTypes.Commands.UpdateCourtType;

public sealed class UpdateCourtTypeValidator : AbstractValidator<UpdateCourtTypeCommand>
{
    public UpdateCourtTypeValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Mã loại sân không được để trống.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Tên loại sân không được để trống.")
            .Must(name => name is null || name.Trim().Length <= 255)
            .WithMessage("Tên loại sân không được vượt quá 255 ký tự.");

        RuleFor(x => x.MinutesConfig)
            .GreaterThan(0)
            .WithMessage("Thời lượng mỗi lượt đặt (phút) phải lớn hơn 0.");
    }
}
