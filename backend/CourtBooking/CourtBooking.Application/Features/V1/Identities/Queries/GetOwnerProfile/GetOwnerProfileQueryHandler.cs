using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Queries.GetOwnerProfile;

internal sealed class GetOwnerProfileQueryHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetOwnerProfileQuery, OwnerProfileDto>
{
    public async Task<Result<OwnerProfileDto>> Handle(GetOwnerProfileQuery request, CancellationToken ct)
    {
        var userId = userContext.UserId;
        var owner = await dbContext.CourtOwners
            .Include(co => co.User)
            .Include(co => co.ServicePackage)
            .AsNoTracking()
            .FirstOrDefaultAsync(co => co.Id == userId && !co.User.IsDeleted, ct);

        if (owner is null)
        {
            return Result.Failure<OwnerProfileDto>(new NotFoundError("CourtOwner", userId));
        }

        CurrentOwnerPackageDto? currentPackage = null;
        if (owner.ServicePackage is not null && owner.PackageStartDate.HasValue && owner.PackageEndDate.HasValue)
        {
            currentPackage = new CurrentOwnerPackageDto(
                owner.ServicePackage.Id,
                owner.ServicePackage.Name,
                owner.ServicePackage.Price,
                owner.PackageStartDate.Value,
                owner.PackageEndDate.Value);
        }
        else
        {
            var latestSub = await dbContext.CourtOwnerSubscriptions
                .Include(s => s.ServicePackage)
                .AsNoTracking()
                .Where(s => s.CourtOwnerId == userId)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync(ct);

            if (latestSub?.ServicePackage is not null)
            {
                currentPackage = new CurrentOwnerPackageDto(
                    latestSub.ServicePackage.Id,
                    latestSub.ServicePackage.Name,
                    latestSub.PricePaid,
                    latestSub.StartDate,
                    latestSub.EndDate);
            }
        }

        var dto = new OwnerProfileDto(
            owner.Id,
            owner.User.FullName,
            owner.User.Email ?? string.Empty,
            owner.User.PhoneNumber ?? string.Empty,
            owner.BusinessName,
            owner.TaxCode,
            currentPackage);

        return Result.Success(dto);
    }
}
