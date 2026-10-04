using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderByOwner;

public sealed class CancelOrderByOwnerValidator : AbstractValidator<CancelOrderByOwnerCommand>
{
    public CancelOrderByOwnerValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("OrderId không được để trống.");

        RuleFor(x => x.CancelReason)
            .NotEmpty().WithMessage("Lý do hủy đơn không được để trống.")
            .MaximumLength(500).WithMessage("Lý do hủy không được vượt quá 500 ký tự.");

        When(x => x.RefundAmount.HasValue && x.RefundAmount.Value > 0, () =>
        {
            RuleFor(x => x.RefundMethod)
                .NotNull().WithMessage("Vui lòng chọn phương thức hoàn tiền (1 = Tiền mặt, 2 = Chuyển khoản QR).")
                .IsInEnum().WithMessage("Phương thức hoàn tiền không hợp lệ.");
        });

        When(x => x.RefundAmount.HasValue, () =>
        {
            RuleFor(x => x.RefundAmount!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Số tiền hoàn phải lớn hơn hoặc bằng 0.");
        });
    }
}
