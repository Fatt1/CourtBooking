using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.UpdateServicePackage;

internal sealed class UpdateServicePackageCommandHandler(IApplicationDbContext dbContext)
    : ICommandHandler<UpdateServicePackageCommand, ServicePackageDto>
{
    public async Task<Result<ServicePackageDto>> Handle(UpdateServicePackageCommand request, CancellationToken ct)
    {
        var package = await dbContext.ServicePackages
            .FirstOrDefaultAsync(p => p.Id == request.Id, ct);

        if (package is null)
        {
            return Result.Failure<ServicePackageDto>(new NotFoundError("ServicePackage", request.Id));
        }

        package.Name = request.Name;
        package.Price = request.Price;
        package.Description = request.Description;
        package.DurationMonths = request.DurationMonths;
        package.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        return Result.Success(new ServicePackageDto(
            package.Id,
            package.Name,
            package.Price,
            package.Description,
            package.DurationMonths));
    }
}
