using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Reviews.Queries.GetReviewByBranch;

public class GetReviewByBranchQueryHandler(IApplicationDbContext dbContext) : IQueryHandler<GetReviewByBranchQuery, ReviewDto>
{
    public async Task<Result<ReviewDto>> Handle(GetReviewByBranchQuery request, CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches.AsNoTracking()
            .Where(b => b.Id == request.BranchId)
            .Select(b => new { b.Id, b.ReviewAverage })
            .FirstOrDefaultAsync(cancellationToken);

        if (branch is null)
        {
            return Result.Failure<ReviewDto>(new NotFoundError("Branch", request.BranchId));
        }

        var reviewsQuery = dbContext.Reviews.AsNoTracking()
            .Where(r => r.BranchId == request.BranchId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewItemDto(
                r.Id,
                r.Player != null ? r.Player.FullName : string.Empty,
                r.Rating,
                r.Comment,
                r.CreatedAt
               ));


        var pagedReviews = await PagedList<ReviewItemDto>.CreateAsync(
            reviewsQuery, request.Page, request.PageSize, cancellationToken);

        var reviewDto = new ReviewDto(
            request.BranchId,
            branch.ReviewAverage,
            pagedReviews
            );

        return Result<ReviewDto>.Success(reviewDto);

    }
}
