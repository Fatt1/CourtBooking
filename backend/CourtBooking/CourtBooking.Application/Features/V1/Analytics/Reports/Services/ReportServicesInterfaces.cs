using CourtBooking.Application.Features.V1.Analytics.Reports.Models;

namespace CourtBooking.Application.Features.V1.Analytics.Reports.Services;

public interface IReportJobManager
{
    ReportJobInfo CreateJob(Guid ownerId, ReportExportFormat format, DateOnly fromDate, DateOnly toDate, Guid? branchId);
    ReportJobInfo? GetJob(Guid jobId);
    void UpdateJobStatus(Guid jobId, ReportExportStatus status, string? errorMessage = null);
    void CompleteJob(Guid jobId, string fileName, byte[] content, string contentType, string? storageKey = null, string? presignedUrl = null);
    (byte[] Content, string ContentType, string FileName)? GetJobFile(Guid jobId);
}

public interface IBackgroundReportQueue
{
    ValueTask EnqueueAsync(Guid jobId, CancellationToken ct = default);
    ValueTask<Guid> DequeueAsync(CancellationToken ct = default);
}

public interface IReportGeneratorService
{
    byte[] GenerateRevenuePdf(CourtOwnerRevenueReportData data);
    byte[] GenerateRevenueExcel(CourtOwnerRevenueReportData data);
}

public interface IReportDataAggregator
{
    Task<CourtOwnerRevenueReportData> AggregateRevenueReportDataAsync(
        Guid courtOwnerId,
        DateOnly fromDate,
        DateOnly toDate,
        Guid? branchId,
        CancellationToken ct = default);
}

