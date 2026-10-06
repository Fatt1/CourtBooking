using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetServiceById;

internal sealed class GetServiceByIdHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetServiceByIdQuery, OwnerServiceDto>
{
    public async Task<Result<OwnerServiceDto>> Handle(
        GetServiceByIdQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;

        var service = await dbContext.Services
            .AsNoTracking()
            .Where(s => s.Id == request.Id && s.Branches.Any(sb => sb.Branch.CourtOwnerId == currentUserId))
            .Select(s => new OwnerServiceDto(
                s.Id,
                s.Name,
                s.Unit,
                s.CategoryId,
                s.Image != null ? new ImageDto(s.Image.StorageKey, s.Image.Id) : null,
                s.CreatedAt,
                s.UpdatedAt,
                s.Branches
                    .Where(sb => sb.Branch.CourtOwnerId == currentUserId)
                    .Select(sb => new OwnerServiceBranchDto(
                        sb.BranchId,
                        sb.Branch.Name,
                        sb.Price,
                        sb.IsActive
                    ))
                    .ToList()
            ))
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);

        if (service is null)
        {
            return Result.Failure<OwnerServiceDto>(new NotFoundError("Service", request.Id));
        }

        return Result.Success(service);
    }
}
