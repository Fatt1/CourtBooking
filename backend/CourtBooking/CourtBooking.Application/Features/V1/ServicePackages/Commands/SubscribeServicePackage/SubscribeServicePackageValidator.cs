using FluentValidation;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.SubscribeServicePackage;

public sealed class SubscribeServicePackageValidator : AbstractValidator<SubscribeServicePackageCommand>
{
    public SubscribeServicePackageValidator()
    {
        RuleFor(x => x.PackageId)
            .NotEmpty().WithMessage("Mã gói dịch vụ không được để trống.");
    }
}
