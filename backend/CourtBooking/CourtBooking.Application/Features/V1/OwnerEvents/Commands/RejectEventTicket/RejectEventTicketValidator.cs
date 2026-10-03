using FluentValidation;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.RejectEventTicket;

public sealed class RejectEventTicketValidator : AbstractValidator<RejectEventTicketCommand>
{
    public RejectEventTicketValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty().WithMessage("Mã sự kiện không được để trống.");

        RuleFor(x => x.TicketId)
            .NotEmpty().WithMessage("Mã vé tham gia không được để trống.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Lý do từ chối không được để trống.")
            .MaximumLength(500).WithMessage("Lý do từ chối không được vượt quá 500 ký tự.");
    }
}
