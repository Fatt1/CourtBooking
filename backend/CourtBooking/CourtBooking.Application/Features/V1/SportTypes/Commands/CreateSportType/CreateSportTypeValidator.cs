using FluentValidation;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;

public sealed class CreateSportTypeValidator
    : AbstractValidator<CreateSportTypeCommand>
{
    public CreateSportTypeValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Tên môn thể thao không được để trống.")
            .Must(name => name is null || name.Trim().Length <= 100)
            .WithMessage("Tên môn thể thao không được vượt quá 100 ký tự.");

        RuleFor(x => x.ImageId)
            .NotEmpty()
            .WithMessage("ID hình ảnh không được để trống.");
    }
}
