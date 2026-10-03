using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;

internal sealed class CreateSportTypeHandler(
    IApplicationDbContext dbContext,
    IPublisher publisher) : ICommandHandler<CreateSportTypeCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateSportTypeCommand request,
        CancellationToken cancellationToken)
    {
        var normalizedName = request.Name.Trim();
        if (request.ImageId.HasValue)
{
    var imageExists = await dbContext.Images
        .AnyAsync(image => image.Id == request.ImageId.Value, cancellationToken);

    if (!imageExists)
    {
        return Result.Failure<Guid>(
            new NotFoundError("Image", request.ImageId.Value));
    }
}
        var existingNames = await dbContext.SportTypes
            .AsNoTracking()
            .Select(sportType => sportType.Name)
            .ToListAsync(cancellationToken);

        var nameAlreadyExists = existingNames.Any(name =>
            string.Equals(
                name,
                normalizedName,
                StringComparison.OrdinalIgnoreCase));

        if (nameAlreadyExists)
        {
            return Result.Failure<Guid>(
                new ConflictError("Tên môn thể thao đã tồn tại."));
        }

        var sportType = new SportType
        {
            Id = Guid.CreateVersion7(),
            Name = normalizedName,
            ImageId = request.ImageId
        };

        await dbContext.SportTypes.AddAsync(
            sportType,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
        if (request.ImageId.HasValue)
{
    await publisher.Publish(
        new AttachImagesEvent([request.ImageId.Value]),
        cancellationToken);
}

        return Result.Success(sportType.Id);
    }
}