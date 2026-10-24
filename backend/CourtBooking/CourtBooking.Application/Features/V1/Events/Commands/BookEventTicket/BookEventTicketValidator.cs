using FluentValidation;

namespace CourtBooking.Application.Features.V1.Events.Commands.BookEventTicket;

public sealed class BookEventTicketValidator : AbstractValidator<BookEventTicketCommand>
{
    public BookEventTicketValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty()
            .WithMessage("Id sự kiện không được để trống.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("Số lượng vé mua phải từ 1 vé trở lên.");
    }
}
