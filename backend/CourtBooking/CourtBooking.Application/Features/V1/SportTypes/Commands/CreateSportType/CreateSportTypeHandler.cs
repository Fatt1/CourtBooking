using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;

public sealed class CreateSportTypeHandler(
    IApplicationDbContext dbContext,
    IPublisher publisher) : ICommandHandler<CreateSportTypeCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateSportTypeCommand request,
        CancellationToken cancellationToken)
    {
        var normalizedName = request.Name.Trim();

        var nameAlreadyExists = await dbContext.SportTypes
            .AsNoTracking()
            .AnyAsync(sportType => string.Equals(
                sportType.Name,
                normalizedName,
                StringComparison.OrdinalIgnoreCase), cancellationToken);


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

        await publisher.Publish(
            new AttachImagesEvent([request.ImageId]),
            cancellationToken);


        return Result.Success(sportType.Id);
    }
}
