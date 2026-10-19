using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetMyOrders;

public sealed class GetMyOrdersHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetMyOrdersQuery, List<MyOrderDto>>
{
    public async Task<Result<List<MyOrderDto>>> Handle(
        GetMyOrdersQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;

        var query = dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Branch)
                .ThenInclude(b => b.BranchSportTypes)
                    .ThenInclude(bst => bst.SportType)
            .Include(o => o.Details)
                .ThenInclude(d => d.Court)
            .Include(o => o.SocialMatch)
            .Where(o => o.PlayerId == currentUserId);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var now = DateTime.Now;

        var result = orders.Select(o =>
        {
            var firstDetail = o.Details
                .OrderBy(d => d.Date)
                .ThenBy(d => d.StartTime)
                .FirstOrDefault();

            var date = firstDetail?.Date ?? o.OrderDate;
            var startTime = firstDetail?.StartTime ?? new TimeOnly(0, 0);
            var endTime = firstDetail?.EndTime ?? new TimeOnly(23, 59);
            var courtName = firstDetail?.Court?.Name ?? "Sân chính";

            var sportType = o.Branch.BranchSportTypes.FirstOrDefault()?.SportType;

            var matchStartTime = date.ToDateTime(startTime);
            var hasSocialMatch = o.SocialMatch != null;
            var canCreateMatch = o.Status == OrderStatus.Confirmed && !hasSocialMatch && matchStartTime > now;

            return new MyOrderDto(
                o.Id,
                o.OrderCode,
                o.BranchId,
                o.Branch.Name,
                $"{o.Branch.Street}, {o.Branch.District}, {o.Branch.Province}",
                o.Branch.District,
                o.Branch.Province,
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
                canCreateMatch);
        });

        if (request.OnlyAvailableForMatch == true)
        {
            result = result.Where(x => x.CanCreateMatch);
        }

        return Result<List<MyOrderDto>>.Success(result.ToList());
    }
}
