using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrders;

internal sealed class GetRetailOrdersHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext,
    IBranchAuthorizationService branchAuthorization)
    : IQueryHandler<GetRetailOrdersQuery, PagedList<RetailOrderListItemDto>>
{
    public async Task<Result<PagedList<RetailOrderListItemDto>>> Handle(
        GetRetailOrdersQuery request,
        CancellationToken cancellationToken)
    {
        if (request.BranchId.HasValue)
        {
            var authorization = await branchAuthorization.EnsureOwnerAsync(request.BranchId.Value, cancellationToken);
            if (authorization.IsFailure)
            {
                return Result.Failure<PagedList<RetailOrderListItemDto>>(authorization.Error!);
            }
        }

        var query = dbContext.RetailOrders.AsNoTracking()
            .Where(order => order.Branch.CourtOwnerId == userContext.UserId);

        if (request.BranchId.HasValue) query = query.Where(order => order.BranchId == request.BranchId.Value);
        if (request.FromDate.HasValue) query = query.Where(order => order.OrderDate >= request.FromDate.Value);
        if (request.ToDate.HasValue) query = query.Where(order => order.OrderDate <= request.ToDate.Value);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(order => order.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(order => new RetailOrderListItemDto(
                order.Id,
                order.BranchId,
                order.Branch.Name,
                order.Items.Sum(item => item.Quantity),
                order.Items.Sum(item => item.Quantity * item.UnitPrice),
                order.DiscountAmount,
                order.TotalAmount,
                order.OrderDate,
                order.CreatedAt))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedList<RetailOrderListItemDto>(items, totalCount, request.Page, request.PageSize));
    }
}
