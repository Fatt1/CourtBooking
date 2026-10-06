using FluentValidation;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.ExtendCourtOwnerSubscription;

public sealed class ExtendCourtOwnerSubscriptionValidator : AbstractValidator<ExtendCourtOwnerSubscriptionCommand>
{
    private static readonly int[] AllowedMonths = [1, 3, 6, 12];

    public ExtendCourtOwnerSubscriptionValidator()
    {
        RuleFor(x => x.CourtOwnerId)
            .NotEmpty().WithMessage("Mã chủ sân (CourtOwnerId) không được để trống.");

        RuleFor(x => x.DurationMonths)
            .Must(m => AllowedMonths.Contains(m))
            .WithMessage("Thời gian gia hạn chỉ được là 1 tháng, 3 tháng, 6 tháng hoặc 12 tháng.");
    }
}
