using CourtBooking.Application.Abstractions.Storage;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Application.Features.V1.Storages.Commands.CleanUpImages;

public sealed class CleanUpImagesHandler : ICommandHandler<CleanUpImagesCommand, int>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly ILogger<CleanUpImagesHandler> _logger;

    public CleanUpImagesHandler(
        IApplicationDbContext dbContext,
        IStorageService storageService,
        ILogger<CleanUpImagesHandler> logger)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<Result<int>> Handle(
        CleanUpImagesCommand request,
        CancellationToken cancellationToken)
    {
        var cutoff = DateTime.UtcNow.AddHours(-24);

        // Clean images with Status == Deleted OR (Status == Pending and CreatedAt older than 24h)
        var imagesToClean = await _dbContext.Images
            .Where(i => i.Status == ImageStatus.Deleted || (i.Status == ImageStatus.Pending && i.CreatedAt < cutoff))
            .ToListAsync(cancellationToken);

        if (imagesToClean.Count == 0)
        {
            return Result.Success(0);
        }

        int deletedCount = 0;
        foreach (var image in imagesToClean)
        {
            try
            {
                await _storageService.DeleteAsync(image.StorageKey, cancellationToken: cancellationToken);
                _dbContext.Images.Remove(image);
                deletedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to delete image {ImageId} with key {StorageKey} from storage (Status: {Status})",
                    image.Id,
                    image.StorageKey,
                    image.Status);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Successfully cleaned up {Count} images (Deleted or Pending > 24h).", deletedCount);

        return Result.Success(deletedCount);
    }
}
