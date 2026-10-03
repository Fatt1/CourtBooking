using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddPaymentTransaction;

public sealed class AddPaymentTransactionValidator : AbstractValidator<AddPaymentTransactionCommand>
{
    public AddPaymentTransactionValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("OrderId không được để trống.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Số tiền thu thêm phải lớn hơn 0.");

        RuleFor(x => x.Method)
            .IsInEnum().WithMessage("Phương thức thanh toán không hợp lệ (1 = Tiền mặt, 2 = Chuyển khoản QR).");
    }
}
