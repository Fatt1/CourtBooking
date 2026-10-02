using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.SportTypes.Queries.GetAdminSportTypes;

internal sealed class GetAdminSportTypesHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetAdminSportTypesQuery, IReadOnlyList<AdminSportTypeDto>>
{
    public async Task<Result<IReadOnlyList<AdminSportTypeDto>>> Handle(
        GetAdminSportTypesQuery request,
        CancellationToken cancellationToken)
    {
        var sportTypes = await dbContext.SportTypes
            .AsNoTracking()
            .Select(item => new AdminSportTypeDto(
                item.Id,
                item.Name,
                item.ImageId,
                item.IsActive,
                item.Branches.Count))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<AdminSportTypeDto>>(sportTypes);
    }
}