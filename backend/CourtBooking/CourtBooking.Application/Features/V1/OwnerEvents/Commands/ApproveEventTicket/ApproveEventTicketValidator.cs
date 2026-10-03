using FluentValidation;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.ApproveEventTicket;

public sealed class ApproveEventTicketValidator : AbstractValidator<ApproveEventTicketCommand>
{
    public ApproveEventTicketValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty().WithMessage("Mã sự kiện không được để trống.");

        RuleFor(x => x.TicketId)
            .NotEmpty().WithMessage("Mã vé tham gia không được để trống.");
    }
}
