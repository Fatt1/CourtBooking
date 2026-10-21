using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetMyOrders;

public sealed class GetMyOrdersHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetMyOrdersQuery, PagedList<MyOrderDto>>
{
    public async Task<Result<PagedList<MyOrderDto>>> Handle(
        GetMyOrdersQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;

        var query = dbContext.Orders
            .AsSplitQuery()
            .AsNoTracking()
            .Include(o => o.Branch)
                .ThenInclude(b => b.BranchSportTypes)
                    .ThenInclude(bst => bst.SportType)
            .Include(o => o.Branch)
                .ThenInclude(b => b.QrImage)
            .Include(o => o.Details)
                .ThenInclude(d => d.Court)
            .Include(o => o.SocialMatch)
            .Include(o => o.Reviews)
            .Where(o => o.PlayerId == currentUserId);

        // Lọc theo trạng thái đơn hàng nếu được cung cấp
        if (request.Status.HasValue)
        {
            query = query.Where(o => o.Status == request.Status.Value);
        }


        var totalCount = await query.CountAsync(cancellationToken);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;

        var resultDtos = orders.Select(o =>
        {
            var firstDetail = o.Details
                .OrderBy(d => d.Date)
                .ThenBy(d => d.StartTime)
                .FirstOrDefault();

            var date = firstDetail!.Date;
            var startTime = firstDetail.StartTime;
            var endTime = firstDetail.EndTime;
            var courtName = firstDetail.Court.Name;

            var sportType = o.Branch.BranchSportTypes.FirstOrDefault()?.SportType;

            var matchStartTime = date.ToDateTime(startTime);
            var hasSocialMatch = o.SocialMatch != null;
            var canCreateMatch = o.Status == OrderStatus.Confirmed && !hasSocialMatch && matchStartTime > DateTime.Now;
            var canPay = o.Status == OrderStatus.AwaitingPayment && o.HoldExpiresAt > now;

            return new MyOrderDto(
                o.Id,
                o.OrderCode,
                o.BranchId,
                o.Branch.Name,
                o.Branch.GetFullAddress(),
                courtName,
                sportType?.Id,
                sportType?.Name,
                date,
                startTime,
                endTime,
                o.TotalAmount,
                o.Status,
                hasSocialMatch,
                o.SocialMatch?.Id,
                canCreateMatch,
                o.HoldExpiresAt,
                canPay,
                o.Branch.AccountNumber,
                o.Branch.AccountName,
                o.Branch.QrImage?.StorageKey,
                o.Reviews.Any(),
                o.CreatedAt);
        }).ToList();

        return Result<PagedList<MyOrderDto>>.Success(new PagedList<MyOrderDto>(
            resultDtos,
            totalCount,
            request.Page,
            request.PageSize));
    }
}
