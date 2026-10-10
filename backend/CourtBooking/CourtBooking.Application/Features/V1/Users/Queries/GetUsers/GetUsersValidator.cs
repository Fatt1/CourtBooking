using FluentValidation;

namespace CourtBooking.Application.Features.V1.Users.Queries.GetUsers;

public sealed class GetUsersValidator : AbstractValidator<GetUsersQuery>
{
    public GetUsersValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0).WithMessage("Trang phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Kích thước trang phải lớn hơn 0.")
            .LessThanOrEqualTo(100).WithMessage("Kích thước trang không được vượt quá 100.");
    }
}
