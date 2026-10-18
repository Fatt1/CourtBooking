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

        var ratings = await dbContext.Reviews.AsNoTracking()
            .Where(r => r.BranchId == request.BranchId)
            .Select(r => (double)r.Rating)
            .ToListAsync(cancellationToken);

        var averageRating = ratings.Count > 0 ? Math.Round(ratings.Average(), 1) : branch.ReviewAverage;

        if (Math.Abs(branch.ReviewAverage - averageRating) > 0.01)
        {
            var branchEntity = await dbContext.Branches.FirstOrDefaultAsync(b => b.Id == request.BranchId, cancellationToken);
            if (branchEntity != null)
            {
                branchEntity.ReviewAverage = averageRating;
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        var reviewDto = new ReviewDto(
            request.BranchId,
            averageRating,
            pagedReviews
            );

        return Result<ReviewDto>.Success(reviewDto);

    }
}
