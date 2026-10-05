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
        var userId = userContext.UserId;

        // 1. Kiểm tra đơn hàng có tồn tại
        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure<Guid>(new NotFoundError("Order", request.OrderId));
        }

        // 2. Kiểm tra quyền sở hữu: Chỉ người đặt đơn mới có quyền đánh giá
        if (order.PlayerId != userId)
        {
            return Result.Failure<Guid>(new ForbiddenError("Bạn chỉ có thể đánh giá đơn hàng của chính mình."));
        }

        // 3. Kiểm tra trạng thái đơn hàng (chỉ cho đánh giá khi đã hoàn thành hoặc qua giờ)
        if (order.Status != OrderStatus.Completed && order.Status != OrderStatus.CheckedIn)
        {
            return Result.Failure<Guid>(new ConflictError("Bạn chỉ có thể đánh giá sau khi đã hoàn thành ca chơi."));
        }

        // 4. Kiểm tra xem đã đánh giá chưa
        var hasReviewed = await dbContext.Reviews
            .AnyAsync(r => r.OrderId == request.OrderId, cancellationToken);

        if (hasReviewed)
        {
            return Result.Failure<Guid>(new ConflictError("Bạn đã đánh giá đơn hàng này rồi."));
        }

        // 5. Tạo Review mới
        var review = new Review
        {
            Id = Guid.CreateVersion7(),
            BranchId = order.BranchId,
            OrderId = order.Id,
            PlayerId = userId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Reviews.Add(review);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(review.Id);
    }
}
