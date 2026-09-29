using FluentValidation;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetOwnerServices;

public sealed class GetOwnerServicesValidator : AbstractValidator<GetOwnerServicesQuery>
{
    public GetOwnerServicesValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize phải nằm trong khoảng từ 1 đến 100.");
    }
}
