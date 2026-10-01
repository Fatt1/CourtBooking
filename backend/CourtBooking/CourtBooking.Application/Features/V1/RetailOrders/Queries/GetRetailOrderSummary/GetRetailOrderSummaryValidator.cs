using FluentValidation;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrderSummary;

public sealed class GetRetailOrderSummaryValidator : AbstractValidator<GetRetailOrderSummaryQuery>
{
    public GetRetailOrderSummaryValidator()
    {
        RuleFor(x => x.ToDate)
            .GreaterThanOrEqualTo(x => x.FromDate)
            .When(x => x.FromDate.HasValue && x.ToDate.HasValue)
            .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
    }
}
