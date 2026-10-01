using FluentValidation;

namespace CourtBooking.Application.Features.V1.RetailOrders.Commands.CreateRetailOrder;

public sealed class CreateRetailOrderValidator : AbstractValidator<CreateRetailOrderCommand>
{
    public CreateRetailOrderValidator()
    {
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.DiscountAmount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PaymentMethod).IsInEnum();
        RuleFor(x => x.CustomerName).MaximumLength(255);
        RuleFor(x => x.Items).NotEmpty();
        RuleFor(x => x.Items)
            .Must(items => items.Select(item => item.ServiceId).Distinct().Count() == items.Count)
            .WithMessage("Mỗi dịch vụ chỉ được xuất hiện một lần trong đơn hàng.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.ServiceId).NotEmpty();
            item.RuleFor(x => x.Quantity).InclusiveBetween(1, 9999);
        });
    }
}
