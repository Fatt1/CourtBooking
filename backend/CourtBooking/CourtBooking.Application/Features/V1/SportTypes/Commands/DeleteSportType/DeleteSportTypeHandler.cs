using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.DeleteSportType;

internal sealed class DeleteSportTypeHandler(
    IApplicationDbContext dbContext,
    IPublisher publisher) : ICommandHandler<DeleteSportTypeCommand>
{
    public async Task<Result> Handle(
        DeleteSportTypeCommand request,
        CancellationToken cancellationToken)
    {
        var sportType = await dbContext.SportTypes
            .FirstOrDefaultAsync(item => item.Id == request.Id, cancellationToken);

        if (sportType is null)
        {
            return Result.Failure(new NotFoundError("SportType", request.Id));
        }

        var isUsedByAnyBranch = await dbContext.Branches
            .AnyAsync(b => b.SportTypeId == request.Id, cancellationToken);

        if (isUsedByAnyBranch)
        {
            return Result.Failure(new ConflictError("Không thể xóa môn thể thao đang có sân sử dụng."));
        }

        var isUsedByEvents = await dbContext.SportEvents
            .AnyAsync(e => e.SportTypeId == request.Id, cancellationToken);

        if (isUsedByEvents)
        {
            return Result.Failure(new ConflictError("Không thể xóa môn thể thao đang có sự kiện sử dụng."));
        }

        var isUsedByMatches = await dbContext.SocialMatches
            .AnyAsync(sm => sm.SportTypeId == request.Id, cancellationToken);

        if (isUsedByMatches)
        {
            return Result.Failure(new ConflictError("Không thể xóa môn thể thao đang có trận đấu sử dụng."));
        }

        var imageId = sportType.ImageId;

        dbContext.SportTypes.Remove(sportType);
        await dbContext.SaveChangesAsync(cancellationToken);

        if (imageId.HasValue)
        {
            await publisher.Publish(
                new DeleteImagesEvent([imageId.Value]),
                cancellationToken);
        }

        return Result.Success();
    }
}
