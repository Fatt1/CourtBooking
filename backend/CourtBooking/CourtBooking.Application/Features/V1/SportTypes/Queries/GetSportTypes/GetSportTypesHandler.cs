using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypes;

internal sealed class GetSportTypesHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetSportTypesQuery, IReadOnlyList<SportTypeDto>>
{
    public async Task<Result<IReadOnlyList<SportTypeDto>>> Handle(
        GetSportTypesQuery request,
        CancellationToken cancellationToken)
    {
        var sportTypes = await dbContext.SportTypes
            .AsNoTracking()
            .Select(sportType => new SportTypeDto(
                sportType.Id,
                sportType.Name,
                sportType.Image != null
                    ? new ImageDto(sportType.Image.StorageKey, sportType.Image.Id)
                    : null))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<SportTypeDto>>(sportTypes);
    }
}