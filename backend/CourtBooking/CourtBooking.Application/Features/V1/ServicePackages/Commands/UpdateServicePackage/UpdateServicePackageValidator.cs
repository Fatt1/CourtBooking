using FluentValidation;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.UpdateServicePackage;

public sealed class UpdateServicePackageValidator : AbstractValidator<UpdateServicePackageCommand>
{
    public UpdateServicePackageValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Mã gói dịch vụ không được để trống.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên gói dịch vụ không được để trống.")
            .MaximumLength(100).WithMessage("Tên gói không được vượt quá 100 ký tự.");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Giá gói cước phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.DurationMonths)
            .GreaterThan((short)0).WithMessage("Thời hạn gói cước phải tối thiểu 1 tháng.");
    }
}
