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

        var owner = await dbContext.CourtOwners
            .Include(co => co.ServicePackage)
            .AsNoTracking()
            .FirstOrDefaultAsync(co => co.Id == ownerId, ct);

        if (owner?.ServicePackage is null || !owner.PackageStartDate.HasValue || !owner.PackageEndDate.HasValue)
        {
            return Result.Success<SubscriptionDto?>(null);
        }

        var dto = new SubscriptionDto(
            owner.ServicePackage.Id,
            owner.ServicePackage.Id,
            owner.ServicePackage.Name,
            owner.ServicePackage.Price,
            owner.PackageStartDate.Value,
            owner.PackageEndDate.Value);

        return Result.Success<SubscriptionDto?>(dto);
    }
}
