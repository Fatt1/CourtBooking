using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Subscriptions;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetServicePackages;

internal sealed class GetServicePackagesQueryHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetServicePackagesQuery, List<ServicePackageDto>>
{
    public async Task<Result<List<ServicePackageDto>>> Handle(GetServicePackagesQuery request, CancellationToken ct)
    {
        var existingPackages = await dbContext.ServicePackages
            .OrderBy(p => p.Price)
            .ToListAsync(ct);

        if (existingPackages.Count == 0)
        {
            var defaultPackages = new List<ServicePackage>
            {
                new()
                {
                    Id = Guid.Parse("11111111-2222-3333-4444-555555555551"),
                    Name = "Basic",
                    Price = 499000m,
                    Description = "",
                    DurationMonths = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.Parse("11111111-2222-3333-4444-555555555552"),
                    Name = "Pro",
                    Price = 1000000m,
                    Description = "",
                    DurationMonths = 3,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.Parse("11111111-2222-3333-4444-555555555553"),
                    Name = "Ultra",
                    Price = 2000000m,
                    Description = "",
                    DurationMonths = 6,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };
            dbContext.ServicePackages.AddRange(defaultPackages);
            await dbContext.SaveChangesAsync(ct);
            existingPackages = defaultPackages;
        }
        else
        {
            var needsSync = false;
            var basic = existingPackages.FirstOrDefault(p => p.Name.Contains("Basic") || p.Name.Contains("Cơ Bản"));
            if (basic is not null && (basic.Price != 499000m || basic.DurationMonths != 1 || !string.IsNullOrEmpty(basic.Description)))
            {
                basic.Name = "Basic";
                basic.Price = 499000m;
                basic.DurationMonths = 1;
                basic.Description = "";
                needsSync = true;
            }

            var pro = existingPackages.FirstOrDefault(p => p.Name.Contains("Pro") || p.Name.Contains("Nâng Cao"));
            if (pro is not null && (pro.Price != 1000000m || pro.DurationMonths != 3 || !string.IsNullOrEmpty(pro.Description)))
            {
                pro.Name = "Pro";
                pro.Price = 1000000m;
                pro.DurationMonths = 3;
                pro.Description = "";
                needsSync = true;
            }

            var ultra = existingPackages.FirstOrDefault(p => p.Name.Contains("Ultra") || p.Name.Contains("VIP") || p.Name.Contains("Doanh Nghiệp"));
            if (ultra is not null && (ultra.Name != "Ultra" || ultra.Price != 2000000m || ultra.DurationMonths != 6 || !string.IsNullOrEmpty(ultra.Description)))
            {
                ultra.Name = "Ultra";
                ultra.Price = 2000000m;
                ultra.DurationMonths = 6;
                ultra.Description = "";
                needsSync = true;
            }

            if (needsSync)
            {
                await dbContext.SaveChangesAsync(ct);
            }
        }

        var packages = existingPackages
            .OrderBy(p => p.Price)
            .Select(p => new ServicePackageDto(
                p.Id,
                p.Name,
                p.Price,
                p.Description,
                p.DurationMonths))
            .ToList();

        return Result.Success(packages);
    }
}
