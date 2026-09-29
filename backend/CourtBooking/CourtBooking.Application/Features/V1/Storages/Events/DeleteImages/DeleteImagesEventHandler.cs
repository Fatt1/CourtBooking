using CourtBooking.Application.Data;
using CourtBooking.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;

public sealed class DeleteImagesEventHandler(
    IApplicationDbContext dbContext,
    ILogger<DeleteImagesEventHandler> logger) : INotificationHandler<DeleteImagesEvent>
{
    public async Task Handle(DeleteImagesEvent notification, CancellationToken cancellationToken)
    {
        if (notification.ImageIds.Count == 0)
            return;
        var imagesToDelete = await dbContext.Images
            .Where(i => notification.ImageIds.Contains(i.Id) && i.Status != ImageStatus.Deleted)
            .ToListAsync(cancellationToken);
        if (imagesToDelete.Count == 0)
            return;
        foreach (var image in imagesToDelete)
        {
            image.Status = ImageStatus.Deleted;
        }
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Marked {Count} images as Deleted.", imagesToDelete.Count);

    }
}
