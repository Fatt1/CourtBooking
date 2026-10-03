using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportType;

internal sealed class UpdateSportTypeHandler(
    IApplicationDbContext dbContext,
    IPublisher publisher) : ICommandHandler<UpdateSportTypeCommand>
{
    public async Task<Result> Handle(
        UpdateSportTypeCommand request,
        CancellationToken cancellationToken)
    {
        var sportType = await dbContext.SportTypes
            .FirstOrDefaultAsync(item => item.Id == request.Id, cancellationToken);

        if (sportType is null)
        {
            return Result.Failure(new NotFoundError("SportType", request.Id));
        }

        var normalizedName = request.Name.Trim();

        var otherNames = await dbContext.SportTypes
            .AsNoTracking()
            .Where(item => item.Id != request.Id)
            .Select(item => item.Name)
            .ToListAsync(cancellationToken);

        var nameAlreadyExists = otherNames.Any(name =>
            string.Equals(name, normalizedName, StringComparison.OrdinalIgnoreCase));

        if (nameAlreadyExists)
        {
            return Result.Failure(
                new ConflictError("Tên môn thể thao đã tồn tại."));
        }

        if (request.ImageId.HasValue)
        {
            var imageExists = await dbContext.Images
                .AnyAsync(
                    image => image.Id == request.ImageId.Value,
                    cancellationToken);

            if (!imageExists)
            {
                return Result.Failure(
                    new NotFoundError("Image", request.ImageId.Value));
            }
        }

        var oldImageId = sportType.ImageId;

        sportType.Name = normalizedName;
        sportType.ImageId = request.ImageId;

        await dbContext.SaveChangesAsync(cancellationToken);

        if (request.ImageId.HasValue && request.ImageId != oldImageId)
        {
            await publisher.Publish(
                new AttachImagesEvent([request.ImageId.Value]),
                cancellationToken);
        }

        if (oldImageId.HasValue && oldImageId != request.ImageId)
        {
            await publisher.Publish(
                new DeleteImagesEvent([oldImageId.Value]),
                cancellationToken);
        }

        return Result.Success();
    }
}