using CourtBooking.Application.Features.V1.Orders.Commands.UpdateCustomerInfo;
using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderCustomerInfo;

public class UpdateOrderCustomerInfoValidator : AbstractValidator<UpdateOrderCustomerInfoCommand>
{

    public UpdateOrderCustomerInfoValidator()
    {
        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Tên khách hàng không được để trống.")
            .MaximumLength(100).WithMessage("Tên khách hàng không được vượt quá 100 ký tự.");
        RuleFor(x => x.CustomerPhoneNumber)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches(@"^(0|\+84)[0-9]{9,10}$").WithMessage("Số điện thoại không đúng định dạng hợp lệ.");
    }
}
