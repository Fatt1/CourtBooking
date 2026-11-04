namespace CourtBooking.Application.Features.V1.Analytics.Reports.Models;

public sealed class ReportJobInfo
{
    public Guid JobId { get; set; } = Guid.NewGuid();
    public Guid CourtOwnerId { get; set; }
    public ReportExportFormat Format { get; set; }
    public ReportExportStatus Status { get; set; } = ReportExportStatus.Pending;
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public Guid? BranchId { get; set; }
    public string? FileName { get; set; }
    public byte[]? FileContent { get; set; }
    public string? ContentType { get; set; }
    public string? StorageKey { get; set; }
    public string? PresignedUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public sealed record ReportJobResponseDto(
    Guid JobId,
    string Format,
    string Status,
    string? FileName,
    string? DownloadUrl,
    string? ErrorMessage,
    DateTime CreatedAt,
    DateTime? CompletedAt);

public sealed record CreateReportExportJobRequest(
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    Guid? BranchId = null,
    ReportExportFormat? Format = null);

