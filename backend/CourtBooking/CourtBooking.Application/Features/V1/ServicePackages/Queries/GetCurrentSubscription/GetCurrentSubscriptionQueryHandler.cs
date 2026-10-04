using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetCurrentSubscription;

internal sealed class GetCurrentSubscriptionQueryHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetCurrentSubscriptionQuery, SubscriptionDto?>
{
    public async Task<Result<SubscriptionDto?>> Handle(GetCurrentSubscriptionQuery request, CancellationToken ct)
    {
        var ownerId = userContext.UserId;

        var latestSub = await dbContext.CourtOwnerSubscriptions
            .Include(s => s.ServicePackage)
            .AsNoTracking()
            .Where(s => s.CourtOwnerId == ownerId)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        if (latestSub is null)
        {
            return Result.Success<SubscriptionDto?>(null);
        }

        var dto = new SubscriptionDto(
            latestSub.Id,
            latestSub.ServicePackageId,
            latestSub.ServicePackage.Name,
            latestSub.PricePaid,
            latestSub.StartDate,
            latestSub.EndDate,
            latestSub.IsActive);

        return Result.Success<SubscriptionDto?>(dto);
    }
}
