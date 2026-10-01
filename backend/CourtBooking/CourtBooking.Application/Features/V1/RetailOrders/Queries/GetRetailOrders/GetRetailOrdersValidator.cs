using FluentValidation;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrders;

public sealed class GetRetailOrdersValidator : AbstractValidator<GetRetailOrdersQuery>
{
    public GetRetailOrdersValidator()
    {
        RuleFor(x => x.PaymentMethod).IsInEnum().When(x => x.PaymentMethod.HasValue);
        RuleFor(x => x.Search).MaximumLength(255);
        RuleFor(x => x.ToDate)
            .GreaterThanOrEqualTo(x => x.FromDate)
            .When(x => x.FromDate.HasValue && x.ToDate.HasValue)
            .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
    }
}
