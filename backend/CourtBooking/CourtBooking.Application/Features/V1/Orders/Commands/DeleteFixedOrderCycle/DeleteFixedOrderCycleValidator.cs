using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.DeleteFixedOrderCycle;

public sealed class DeleteFixedOrderCycleValidator : AbstractValidator<DeleteFixedOrderCycleCommand>
{
    public DeleteFixedOrderCycleValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("OrderId không được để trống.");

        RuleFor(x => x.CycleId)
            .NotEmpty().WithMessage("CycleId không được để trống.");
    }
}
