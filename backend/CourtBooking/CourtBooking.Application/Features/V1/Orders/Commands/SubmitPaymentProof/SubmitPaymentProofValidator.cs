using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.SubmitPaymentProof;

public sealed class SubmitPaymentProofValidator : AbstractValidator<SubmitPaymentProofCommand>
{
    public SubmitPaymentProofValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Mã đơn hàng (OrderId) không được để trống.");

        RuleFor(x => x.ImageId)
            .NotEmpty().WithMessage("Mã ảnh chứng từ thanh toán (ImageId) không được để trống.");
    }
}
