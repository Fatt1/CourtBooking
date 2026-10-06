using FluentValidation;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.CreateServicePackage;

public sealed class CreateServicePackageValidator : AbstractValidator<CreateServicePackageCommand>
{
    public CreateServicePackageValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên gói dịch vụ không được để trống.")
            .MaximumLength(100).WithMessage("Tên gói không được vượt quá 100 ký tự.");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Giá gói cước phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.DurationMonths)
            .GreaterThan((short)0).WithMessage("Thời hạn gói cước phải tối thiểu 1 tháng.");
    }
}
