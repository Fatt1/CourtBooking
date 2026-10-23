using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderOnline;

public sealed class CancelOrderOnlineValidator : AbstractValidator<CancelOrderOnlineCommand>
{
    public CancelOrderOnlineValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("OrderId is required.");
    }
}
