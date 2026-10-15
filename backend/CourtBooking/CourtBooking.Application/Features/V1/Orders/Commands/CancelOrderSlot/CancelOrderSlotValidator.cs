using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderSlot;

public sealed class CancelOrderSlotValidator : AbstractValidator<CancelOrderSlotCommand>
{
    public CancelOrderSlotValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty().WithMessage("Mã đơn hàng không được để trống.");
        RuleFor(x => x.OrderDetailId).NotEmpty().WithMessage("Mã ca sân không được để trống.");
        RuleFor(x => x.RefundAmount).GreaterThanOrEqualTo(0).When(x => x.RefundAmount.HasValue)
            .WithMessage("Số tiền hoàn lại không được âm.");
    }
}
