using CourtBooking.Application.Abstractions.Storage;
using CourtBooking.Application.Features.V1.Analytics.Reports.Models;
using CourtBooking.Application.Features.V1.Analytics.Reports.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Infrastructure.Analytics.Reports;

public sealed class ReportExportBackgroundService : BackgroundService
{
    private readonly IBackgroundReportQueue _queue;
    private readonly IReportJobManager _jobManager;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReportExportBackgroundService> _logger;

    public ReportExportBackgroundService(
        IBackgroundReportQueue queue,
        IReportJobManager jobManager,
        IServiceProvider serviceProvider,
        ILogger<ReportExportBackgroundService> logger)
    {
        _queue = queue;
        _jobManager = jobManager;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ReportExportBackgroundService is running.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var jobId = await _queue.DequeueAsync(stoppingToken);
                await ProcessJobAsync(jobId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in ReportExportBackgroundService loop.");
            }
        }

        _logger.LogInformation("ReportExportBackgroundService is stopping.");
    }

    private async Task ProcessJobAsync(Guid jobId, CancellationToken ct)
    {
        var job = _jobManager.GetJob(jobId);
        if (job == null)
        {
            _logger.LogWarning("Job {JobId} not found in manager when dequeued.", jobId);
            return;
        }

        _logger.LogInformation("Processing report export job {JobId} for Owner {OwnerId}, Format: {Format}",
            jobId, job.CourtOwnerId, job.Format);

        _jobManager.UpdateJobStatus(jobId, ReportExportStatus.Processing);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var aggregator = scope.ServiceProvider.GetRequiredService<IReportDataAggregator>();
            var generator = scope.ServiceProvider.GetRequiredService<IReportGeneratorService>();
            var storage = scope.ServiceProvider.GetService<IStorageService>();

            // 1. Tổng hợp dữ liệu
            var data = await aggregator.AggregateRevenueReportDataAsync(
                job.CourtOwnerId,
                job.FromDate,
                job.ToDate,
                job.BranchId,
                ct);

            // 2. Tạo nội dung tệp tin
            byte[] fileBytes;
            string contentType;
            string fileExtension;

            if (job.Format == ReportExportFormat.Pdf)
            {
                fileBytes = generator.GenerateRevenuePdf(data);
                contentType = "application/pdf";
                fileExtension = "pdf";
            }
            else
            {
                fileBytes = generator.GenerateRevenueExcel(data);
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                fileExtension = "xlsx";
            }

            var cleanFromDate = job.FromDate.ToString("yyyyMMdd");
            var cleanToDate = job.ToDate.ToString("yyyyMMdd");
            var fileName = $"BaoCaoDoanhThu_{cleanFromDate}_{cleanToDate}_{jobId:N}[..8].{fileExtension}";

            // 3. Tải lên lưu trữ (SeaweedFS / S3) nếu có
            string? storageKey = null;
            string? presignedUrl = null;

            if (storage != null)
            {
                try
                {
                    using var ms = new MemoryStream(fileBytes);
                    var key = $"reports/{job.CourtOwnerId}/{fileName}";
                    storageKey = await storage.UploadAsync(ms, key, contentType, cancellationToken: ct);
                    presignedUrl = await storage.GetPresignedUrlAsync(storageKey, 86400, cancellationToken: ct);
                }
                catch (Exception storageEx)
                {
                    _logger.LogWarning(storageEx, "Could not upload report {JobId} to storage. Direct in-memory download remains available.", jobId);
                }
            }

            // 4. Đánh dấu hoàn thành
            _jobManager.CompleteJob(jobId, fileName, fileBytes, contentType, storageKey, presignedUrl);
            _logger.LogInformation("Successfully completed report export job {JobId}. Size: {Size} bytes.", jobId, fileBytes.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process report export job {JobId}.", jobId);
            _jobManager.UpdateJobStatus(jobId, ReportExportStatus.Failed, ex.Message);
        }
    }
}

