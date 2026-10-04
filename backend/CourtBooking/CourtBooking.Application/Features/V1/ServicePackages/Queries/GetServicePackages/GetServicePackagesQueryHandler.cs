using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetServicePackages;

internal sealed class GetServicePackagesQueryHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetServicePackagesQuery, List<ServicePackageDto>>
{
    public async Task<Result<List<ServicePackageDto>>> Handle(GetServicePackagesQuery request, CancellationToken ct)
    {
        var packages = await dbContext.ServicePackages
            .AsNoTracking()
            .OrderBy(p => p.Price)
            .Select(p => new ServicePackageDto(
                p.Id,
                p.Name,
                p.Price,
                p.Description,
                p.DurationMonths))
            .ToListAsync(ct);

        return Result.Success(packages);
    }
}
