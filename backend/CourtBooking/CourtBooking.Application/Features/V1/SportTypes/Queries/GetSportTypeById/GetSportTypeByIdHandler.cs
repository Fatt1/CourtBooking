using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypeById;

internal sealed class GetSportTypeByIdHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetSportTypeByIdQuery, SportTypeDto>
{
    public async Task<Result<SportTypeDto>> Handle(
        GetSportTypeByIdQuery request,
        CancellationToken cancellationToken)
    {
        var sportType = await dbContext.SportTypes
            .AsNoTracking()
            .Where(item => item.Id == request.Id)
            .Select(item => new SportTypeDto(
                item.Id,
                item.Name,
                item.Image != null
                    ? new ImageDto(item.Image.StorageKey, item.Image.Id)
                    : null))
            .FirstOrDefaultAsync(cancellationToken);

        return sportType is null
            ? Result.Failure<SportTypeDto>(new NotFoundError("SportType", request.Id))
            : Result.Success(sportType);
    }
}