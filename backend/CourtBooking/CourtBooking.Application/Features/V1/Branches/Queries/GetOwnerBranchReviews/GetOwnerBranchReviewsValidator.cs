using FluentValidation;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchReviews;

public sealed class GetOwnerBranchReviewsValidator : AbstractValidator<GetOwnerBranchReviewsQuery>
{
    public GetOwnerBranchReviewsValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("Branch ID is required.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize phải nằm trong khoảng từ 1 đến 100.");
    }
}
