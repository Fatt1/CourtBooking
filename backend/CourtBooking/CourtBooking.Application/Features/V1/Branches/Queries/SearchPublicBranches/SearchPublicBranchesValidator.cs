using FluentValidation;

namespace CourtBooking.Application.Features.V1.Branches.Queries.SearchPublicBranches;

public sealed class SearchPublicBranchesValidator : AbstractValidator<SearchPublicBranchesQuery>
{
    public SearchPublicBranchesValidator()
    {
        RuleFor(x => x)
            .Must(x => (x.Date.HasValue && x.StartTime.HasValue) || (!x.Date.HasValue && !x.StartTime.HasValue))
            .WithMessage("Nếu truyền date thì phải truyền startTime và ngược lại.");

        RuleFor(x => x.MinRating)
            .InclusiveBetween(1.0, 5.0).When(x => x.MinRating.HasValue)
            .WithMessage("Điểm đánh giá tối thiểu phải từ 1 đến 5.");

        RuleFor(x => x.Sort)
            .Must(s => string.IsNullOrEmpty(s) || s == "relevance" || s == "rating_desc" || s == "distance" || s == "price_asc")
            .WithMessage("Kiểu sắp xếp không hợp lệ (hỗ trợ: relevance, rating_desc, distance, price_asc).");

        RuleFor(x => x.Latitude)
            .NotNull().When(x => x.Sort == "distance")
            .WithMessage("Vui lòng cung cấp tọa độ (latitude) khi sắp xếp theo khoảng cách.");

        RuleFor(x => x.Longitude)
            .NotNull().When(x => x.Sort == "distance")
            .WithMessage("Vui lòng cung cấp tọa độ (longitude) khi sắp xếp theo khoảng cách.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize phải nằm trong khoảng từ 1 đến 100.");
    }
}
