using FluentValidation;

namespace CourtBooking.Application.Features.V1.Reviews.Commands.CreateReview;

public sealed class CreateReviewValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty().WithMessage("Mã đơn hàng không được để trống.");
        RuleFor(x => x.Rating)
            .InclusiveBetween((byte)1, (byte)5)
            .WithMessage("Điểm đánh giá phải từ 1 đến 5 sao.");
        RuleFor(x => x.Comment)
            .MaximumLength(1000)
            .WithMessage("Bình luận không được vượt quá 1000 ký tự.");
    }
}
