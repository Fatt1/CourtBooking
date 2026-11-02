using System.Collections.Concurrent;
using System.Threading.Channels;
using CourtBooking.Application.Features.V1.Analytics.Reports.Models;
using CourtBooking.Application.Features.V1.Analytics.Reports.Services;

namespace CourtBooking.Infrastructure.Analytics.Reports;

public sealed class InMemoryReportJobManager : IReportJobManager
{
    private readonly ConcurrentDictionary<Guid, ReportJobInfo> _jobs = new();
    private readonly ConcurrentDictionary<Guid, (byte[] Content, string ContentType, string FileName)> _files = new();

    public ReportJobInfo CreateJob(
        Guid ownerId,
        ReportExportFormat format,
        DateOnly fromDate,
        DateOnly toDate,
        Guid? branchId)
    {
        var job = new ReportJobInfo
        {
            JobId = Guid.NewGuid(),
            CourtOwnerId = ownerId,
            Format = format,
            Status = ReportExportStatus.Pending,
            FromDate = fromDate,
            ToDate = toDate,
            BranchId = branchId,
            CreatedAt = DateTime.UtcNow
        };

        _jobs[job.JobId] = job;
        return job;
    }

    public ReportJobInfo? GetJob(Guid jobId)
    {
        _jobs.TryGetValue(jobId, out var job);
        return job;
    }

    public void UpdateJobStatus(Guid jobId, ReportExportStatus status, string? errorMessage = null)
    {
        if (_jobs.TryGetValue(jobId, out var job))
        {
            job.Status = status;
            job.ErrorMessage = errorMessage;
            if (status == ReportExportStatus.Completed || status == ReportExportStatus.Failed)
            {
                job.CompletedAt = DateTime.UtcNow;
            }
        }
    }

    public void CompleteJob(
        Guid jobId,
        string fileName,
        byte[] content,
        string contentType,
        string? storageKey = null,
        string? presignedUrl = null)
    {
        if (_jobs.TryGetValue(jobId, out var job))
        {
            job.Status = ReportExportStatus.Completed;
            job.FileName = fileName;
            job.FileContent = content;
            job.ContentType = contentType;
            job.StorageKey = storageKey;
            job.PresignedUrl = presignedUrl;
            job.CompletedAt = DateTime.UtcNow;

            _files[jobId] = (content, contentType, fileName);
        }
    }

    public (byte[] Content, string ContentType, string FileName)? GetJobFile(Guid jobId)
    {
        if (_files.TryGetValue(jobId, out var file))
        {
            return file;
        }

        if (_jobs.TryGetValue(jobId, out var job) && job.FileContent != null && job.ContentType != null && job.FileName != null)
        {
            return (job.FileContent, job.ContentType, job.FileName);
        }

        return null;
    }
}

public sealed class ChannelBackgroundReportQueue : IBackgroundReportQueue
{
    private readonly Channel<Guid> _channel = Channel.CreateUnbounded<Guid>(new UnboundedChannelOptions
    {
        SingleReader = true
    });

    public ValueTask EnqueueAsync(Guid jobId, CancellationToken ct = default)
    {
        return _channel.Writer.WriteAsync(jobId, ct);
    }

    public ValueTask<Guid> DequeueAsync(CancellationToken ct = default)
    {
        return _channel.Reader.ReadAsync(ct);
    }
}

