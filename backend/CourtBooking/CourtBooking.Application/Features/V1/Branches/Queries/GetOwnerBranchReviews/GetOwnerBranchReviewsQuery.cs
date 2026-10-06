using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchReviews;

public sealed record GetOwnerBranchReviewsQuery(
    Guid BranchId,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<OwnerBranchReviewsDto>;
