using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Reviews;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Reviews.Commands.CreateReview;

public sealed class CreateReviewCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<CreateReviewCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        // var userId = userContext.UserId; // CHÍNH THỨC: Sử dụng khi có Auth

        // 1. Kiểm tra đơn hàng có tồn tại
        // TEMP FOR TESTING: Tạm thời bỏ check "o.PlayerId == userId" để bạn có thể test dễ dàng
        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure<Guid>(new NotFoundError("Order", request.OrderId));
        }

        var userId = order.PlayerId; // TEMP: Tự động dùng PlayerId của đơn hàng này để test

        // 2. Kiểm tra trạng thái đơn hàng (chỉ cho đánh giá khi đã hoàn thành hoặc qua giờ)
        if (order.Status != OrderStatus.Completed && order.Status != OrderStatus.CheckedIn)
        {
            return Result.Failure<Guid>(new ConflictError("Bạn chỉ có thể đánh giá sau khi đã hoàn thành ca chơi."));
        }

        // 3. Kiểm tra xem đã đánh giá chưa
        var hasReviewed = await dbContext.Reviews
            .AnyAsync(r => r.OrderId == request.OrderId, cancellationToken);

        if (hasReviewed)
        {
            return Result.Failure<Guid>(new ConflictError("Bạn đã đánh giá đơn hàng này rồi."));
        }

        // 4. Tạo Review mới
        var review = new Review
        {
            Id = Guid.CreateVersion7(),
            BranchId = order.BranchId,
            OrderId = order.Id,
            PlayerId = userId.GetValueOrDefault(),
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow,
            Images = new List<ReviewImage>()
        };

        if (request.ImageIds != null && request.ImageIds.Any())
        {
            foreach (var imgId in request.ImageIds)
            {
                review.Images.Add(new ReviewImage
                {
                    Id = Guid.CreateVersion7(),
                    ReviewId = review.Id,
                    ImageId = imgId
                });
            }
        }

        dbContext.Reviews.Add(review);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(review.Id);
    }
}
