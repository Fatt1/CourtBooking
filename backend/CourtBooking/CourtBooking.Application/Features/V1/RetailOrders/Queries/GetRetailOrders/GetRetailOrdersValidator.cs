using FluentValidation;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrders;

public sealed class GetRetailOrdersValidator : AbstractValidator<GetRetailOrdersQuery>
{
    public GetRetailOrdersValidator()
    {
        RuleFor(x => x.ToDate)
            .GreaterThanOrEqualTo(x => x.FromDate)
            .When(x => x.FromDate.HasValue && x.ToDate.HasValue)
            .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");

        RuleFor(x => x.Search)
            .MaximumLength(100).WithMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Search));
    }
}
