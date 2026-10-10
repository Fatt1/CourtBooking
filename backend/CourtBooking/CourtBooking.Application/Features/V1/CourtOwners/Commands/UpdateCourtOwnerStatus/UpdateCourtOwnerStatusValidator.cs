using FluentValidation;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.UpdateCourtOwnerStatus;

public sealed class UpdateCourtOwnerStatusValidator : AbstractValidator<UpdateCourtOwnerStatusCommand>
{
    public UpdateCourtOwnerStatusValidator()
    {
        RuleFor(x => x.CourtOwnerId)
            .NotEmpty().WithMessage("Mã chủ sân (CourtOwnerId) không được để trống.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái người dùng không hợp lệ.");
    }
}
