using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Subscriptions;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.CreateServicePackage;

internal sealed class CreateServicePackageCommandHandler(IApplicationDbContext dbContext)
    : ICommandHandler<CreateServicePackageCommand, ServicePackageDto>
{
    public async Task<Result<ServicePackageDto>> Handle(CreateServicePackageCommand request, CancellationToken ct)
    {
        var package = new ServicePackage
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Price = request.Price,
            Description = request.Description,
            DurationMonths = request.DurationMonths,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.ServicePackages.Add(package);
        await dbContext.SaveChangesAsync(ct);

        return Result.Success(new ServicePackageDto(
            package.Id,
            package.Name,
            package.Price,
            package.Description,
            package.DurationMonths));
    }
}
