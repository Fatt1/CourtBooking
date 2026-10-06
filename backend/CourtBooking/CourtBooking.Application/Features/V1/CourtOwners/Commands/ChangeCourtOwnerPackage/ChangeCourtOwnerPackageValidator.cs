using FluentValidation;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.ChangeCourtOwnerPackage;

public sealed class ChangeCourtOwnerPackageValidator : AbstractValidator<ChangeCourtOwnerPackageCommand>
{
    public ChangeCourtOwnerPackageValidator()
    {
        RuleFor(x => x.CourtOwnerId)
            .NotEmpty().WithMessage("Mã chủ sân (CourtOwnerId) không được để trống.");

        RuleFor(x => x.NewPackageId)
            .NotEmpty().WithMessage("Mã gói dịch vụ mới (NewPackageId) không được để trống.");
    }
}
