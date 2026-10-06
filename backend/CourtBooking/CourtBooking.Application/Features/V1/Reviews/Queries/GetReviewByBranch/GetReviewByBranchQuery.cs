using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Reviews.Queries.GetReviewByBranch;

public record GetReviewByBranchQuery(Guid BranchId,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<ReviewDto>;



public sealed record ReviewItemDto(
    Guid Id,
    string PlayerName,
    byte Rating,
    string? Comment,
    DateTime CreatedAt);


public sealed record ReviewDto(
    Guid BranchId,
    double AverageRating,
    PagedList<ReviewItemDto> Reviews);
