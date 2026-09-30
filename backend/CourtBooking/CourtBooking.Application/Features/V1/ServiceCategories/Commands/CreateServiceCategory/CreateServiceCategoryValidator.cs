using FluentValidation;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Commands.CreateServiceCategory;

public sealed class CreateServiceCategoryValidator : AbstractValidator<CreateServiceCategoryCommand>
{
    public CreateServiceCategoryValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên loại dịch vụ không được để trống.")
            .MaximumLength(150).WithMessage("Tên loại dịch vụ không được vượt quá 150 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(300).WithMessage("Mô tả không được vượt quá 300 ký tự.");
    }
}
