using CourtBooking.Application.Data;
using CourtBooking.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Application.Features.V1.Storages.Events.AttachImages;

public sealed class AttachImagesEventHandler : INotificationHandler<AttachImagesEvent>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ILogger<AttachImagesEventHandler> _logger;

    public AttachImagesEventHandler(
        IApplicationDbContext dbContext,
        ILogger<AttachImagesEventHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Handle(
        AttachImagesEvent notification,
        CancellationToken cancellationToken)
    {
        if (notification.ImageIds.Count == 0)
        {
            return;
        }

        var pendingImages = await _dbContext.Images
            .Where(i => notification.ImageIds.Contains(i.Id) && i.Status == ImageStatus.Pending)
            .ToListAsync(cancellationToken);

        if (pendingImages.Count == 0)
        {
            _logger.LogInformation("No pending images found to attach for the specified IDs.");
            return;
        }

        foreach (var image in pendingImages)
        {
            image.Status = ImageStatus.Attached;
            image.AttachedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Successfully marked {Count} images as Attached.",
            pendingImages.Count);
    }
}
