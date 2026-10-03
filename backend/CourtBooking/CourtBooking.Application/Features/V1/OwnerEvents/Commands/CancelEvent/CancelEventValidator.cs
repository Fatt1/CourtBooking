using FluentValidation;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.CancelEvent;

public sealed class CancelEventValidator : AbstractValidator<CancelEventCommand>
{
    public CancelEventValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty()
            .WithMessage("Id sự kiện không được để trống.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Lý do hủy sự kiện không được để trống.")
            .MaximumLength(255)
            .WithMessage("Lý do hủy tối đa 255 ký tự.");
    }
}
