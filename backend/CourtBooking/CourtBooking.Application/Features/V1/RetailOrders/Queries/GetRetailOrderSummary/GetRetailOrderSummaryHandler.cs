using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrderSummary;

internal sealed class GetRetailOrderSummaryHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext,
    IBranchAuthorizationService branchAuthorization)
    : IQueryHandler<GetRetailOrderSummaryQuery, RetailOrderSummaryDto>
{
    public async Task<Result<RetailOrderSummaryDto>> Handle(
        GetRetailOrderSummaryQuery request,
        CancellationToken cancellationToken)
    {
        if (request.BranchId.HasValue)
        {
            var authorization = await branchAuthorization.EnsureOwnerAsync(request.BranchId.Value, cancellationToken);
            if (authorization.IsFailure)
            {
                return Result.Failure<RetailOrderSummaryDto>(authorization.Error!);
            }
        }

        var query = dbContext.RetailOrders.AsNoTracking()
            .Where(order => order.Branch.CourtOwnerId == userContext.UserId);
        if (request.BranchId.HasValue) query = query.Where(order => order.BranchId == request.BranchId.Value);
        if (request.FromDate.HasValue) query = query.Where(order => order.OrderDate >= request.FromDate.Value);
        if (request.ToDate.HasValue) query = query.Where(order => order.OrderDate <= request.ToDate.Value);

        var summary = await query
            .GroupBy(_ => 1)
            .Select(group => new RetailOrderSummaryDto(
                group.Count(),
                group.SelectMany(order => order.Items).Sum(item => item.Quantity),
                group.SelectMany(order => order.Items).Sum(item => item.Quantity * item.UnitPrice),
                group.Sum(order => order.DiscountAmount),
                group.Sum(order => order.TotalAmount)))
            .SingleOrDefaultAsync(cancellationToken);

        return Result.Success(summary ?? new RetailOrderSummaryDto(0, 0, 0, 0, 0));
    }
}
