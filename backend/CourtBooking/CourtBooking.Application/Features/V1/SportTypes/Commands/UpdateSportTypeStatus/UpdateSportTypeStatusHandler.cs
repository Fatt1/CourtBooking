using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportTypeStatus;

internal sealed class UpdateSportTypeStatusHandler(
    IApplicationDbContext dbContext)
    : ICommandHandler<UpdateSportTypeStatusCommand>
{
    public async Task<Result> Handle(
        UpdateSportTypeStatusCommand request,
        CancellationToken cancellationToken)
    {
        var sportType = await dbContext.SportTypes
            .FirstOrDefaultAsync(item => item.Id == request.Id, cancellationToken);

        if (sportType is null)
        {
            return Result.Failure(new NotFoundError("SportType", request.Id));
        }

        sportType.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}