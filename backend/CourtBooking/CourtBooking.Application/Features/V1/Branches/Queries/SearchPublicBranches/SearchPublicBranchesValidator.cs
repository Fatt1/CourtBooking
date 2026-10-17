using FluentValidation;

namespace CourtBooking.Application.Features.V1.Branches.Queries.SearchPublicBranches;

public sealed class SearchPublicBranchesValidator : AbstractValidator<SearchPublicBranchesQuery>
{
    public SearchPublicBranchesValidator()
    {
        // Nếu tìm theo khung giờ: bắt buộc phải có cả date, startTime và endTime
        RuleFor(x => x)
            .Must(x =>
                (x.Date.HasValue && x.StartTime.HasValue && x.EndTime.HasValue)
                || (!x.Date.HasValue && !x.StartTime.HasValue && !x.EndTime.HasValue))
            .WithMessage("Nếu tìm theo khung giờ phải truyền đủ date, startTime và endTime.");

        // endTime phải sau startTime
        RuleFor(x => x)
            .Must(x => !x.StartTime.HasValue || !x.EndTime.HasValue || x.EndTime.Value > x.StartTime.Value)
            .WithMessage("endTime phải lớn hơn startTime.");

        RuleFor(x => x.MinPrice)
            .GreaterThanOrEqualTo(0).When(x => x.MinPrice.HasValue)
            .WithMessage("Giá tối thiểu phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(0).When(x => x.MaxPrice.HasValue)
            .WithMessage("Giá tối đa phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x)
            .Must(x => !x.MinPrice.HasValue || !x.MaxPrice.HasValue || x.MaxPrice.Value >= x.MinPrice.Value)
            .WithMessage("Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1.0, 5.0).When(x => x.Rating.HasValue)
            .WithMessage("Điểm đánh giá phải từ 1 đến 5.");

        RuleFor(x => x.Sort)
            .Must(s => string.IsNullOrEmpty(s) || s == "relevance" || s == "rating_desc" || s == "distance" || s == "price_asc")
            .WithMessage("Kiểu sắp xếp không hợp lệ (hỗ trợ: relevance, rating_desc, distance, price_asc).");

        // Ràng buộc tọa độ GPS nếu người dùng cung cấp
        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90m, 90m).When(x => x.Latitude.HasValue)
            .WithMessage("Vĩ độ (latitude) phải nằm trong khoảng từ -90 đến 90.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180m, 180m).When(x => x.Longitude.HasValue)
            .WithMessage("Kinh độ (longitude) phải nằm trong khoảng từ -180 đến 180.");

        RuleFor(x => x)
            .Must(x => (x.Latitude.HasValue && x.Longitude.HasValue) || (!x.Latitude.HasValue && !x.Longitude.HasValue))
            .WithMessage("Nếu cung cấp tọa độ thì phải truyền đủ cả latitude và longitude.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize phải nằm trong khoảng từ 1 đến 100.");
    }
}
