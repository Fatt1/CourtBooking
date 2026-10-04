using FluentValidation;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetSubscriptionHistory;

public sealed class GetSubscriptionHistoryValidator : AbstractValidator<GetSubscriptionHistoryQuery>
{
    public GetSubscriptionHistoryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang (Page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Kích thước trang (PageSize) phải từ 1 đến 100.");
    }
}
