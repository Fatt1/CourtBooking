using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchReviews;

internal sealed class GetOwnerBranchReviewsHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext)
    : IQueryHandler<GetOwnerBranchReviewsQuery, OwnerBranchReviewsDto>
{
    public async Task<Result<OwnerBranchReviewsDto>> Handle(
        GetOwnerBranchReviewsQuery request, CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches.AsNoTracking()
            .Where(b => b.Id == request.BranchId)
            .Select(b => new { b.Id, b.CourtOwnerId })
            .FirstOrDefaultAsync(cancellationToken);

        if (branch is null)
            return Result.Failure<OwnerBranchReviewsDto>(new NotFoundError("Branch", request.BranchId));

        if (branch.CourtOwnerId != userContext.UserId)
            return Result.Failure<OwnerBranchReviewsDto>(new ForbiddenError("Chi nhánh không thuộc chủ sân này."));

        var reviewsQuery = dbContext.Reviews.AsNoTracking()
            .Where(r => r.BranchId == request.BranchId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new BranchReviewItemDto(
                r.Id,
                r.Player != null ? r.Player.FullName : string.Empty,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                r.Image != null ? new BranchImageDto(r.Image.Id, r.Image.StorageKey) : null));

        var pagedReviews = await PagedList<BranchReviewItemDto>.CreateAsync(
            reviewsQuery, request.Page, request.PageSize, cancellationToken);

        double? averageRating = pagedReviews.TotalCount == 0
            ? null
            : await dbContext.Reviews.AsNoTracking()
                .Where(r => r.BranchId == request.BranchId)
                .AverageAsync(r => (double)r.Rating, cancellationToken);

        var result = new OwnerBranchReviewsDto(
            request.BranchId,
            averageRating,
            pagedReviews.TotalCount,
            pagedReviews);

        return Result.Success(result);
    }
}
