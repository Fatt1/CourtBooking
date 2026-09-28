using CourtBooking.Application.Features.V1.Storages.Commands.CleanUpImages;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Infrastructure.BackgroundJobs;

public sealed class CleanUpImagesBackgroundService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CleanUpImagesBackgroundService> _logger;

    public CleanUpImagesBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<CleanUpImagesBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CleanUpImagesBackgroundService started. Interval: {Interval}", Interval);

        using var timer = new PeriodicTimer(Interval);

        try
        {
            // Initial delay to avoid impacting application startup
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            await ExecuteCleanupAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ExecuteCleanupAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException ex) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation(ex, "CleanUpImagesBackgroundService is stopping gracefully.");
        }
    }

    private async Task ExecuteCleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Running scheduled cleanup for Deleted images and Pending images older than 24 hours.");
            using var scope = _serviceProvider.CreateScope();
            var sender = scope.ServiceProvider.GetRequiredService<ISender>();

            var result = await sender.Send(new CleanUpImagesCommand(), cancellationToken);
            if (result.IsSuccess)
            {
                _logger.LogInformation("Scheduled image cleanup completed: {Count} images processed.", result.Value);
            }
            else
            {
                _logger.LogWarning("Scheduled image cleanup reported failure: {Error}", result.Error?.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred during images cleanup.");
        }
    }
}
