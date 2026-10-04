using FluentValidation;

namespace CourtBooking.Application.Features.V1.Events.Queries.GetPublicEvents;

public sealed class GetPublicEventsValidator : AbstractValidator<GetPublicEventsQuery>
{
    public GetPublicEventsValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Trang hiện tại (Page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Số lượng sự kiện mỗi trang (PageSize) phải từ 1 đến 100.");
    }
}
