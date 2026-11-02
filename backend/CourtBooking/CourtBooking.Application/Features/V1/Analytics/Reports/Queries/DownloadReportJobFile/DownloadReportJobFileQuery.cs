using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Analytics.Reports.Models;
using CourtBooking.Application.Features.V1.Analytics.Reports.Services;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.Analytics.Reports.Queries.DownloadReportJobFile;

public sealed record ReportFileResult(byte[] Content, string ContentType, string FileName);

public sealed record DownloadReportJobFileQuery(Guid JobId) : IQuery<ReportFileResult>;

internal sealed class DownloadReportJobFileQueryHandler(
    IReportJobManager jobManager,
    IUserContext userContext)
    : IQueryHandler<DownloadReportJobFileQuery, ReportFileResult>
{
    public Task<Result<ReportFileResult>> Handle(
        DownloadReportJobFileQuery request,
        CancellationToken cancellationToken)
    {
        var job = jobManager.GetJob(request.JobId);
        if (job == null)
        {
            return Task.FromResult(Result.Failure<ReportFileResult>(
                new NotFoundError("ReportExportJob", request.JobId)));
        }

        if (userContext.UserId != Guid.Empty && job.CourtOwnerId != userContext.UserId)
        {
            return Task.FromResult(Result.Failure<ReportFileResult>(
                new ForbiddenError("Bạn không có quyền tải file báo cáo này.")));
        }

        if (job.Status != ReportExportStatus.Completed)
        {
            return Task.FromResult(Result.Failure<ReportFileResult>(
                new ConflictError($"File báo cáo chưa sẵn sàng. Trạng thái hiện tại: {job.Status}.")));
        }

        var file = jobManager.GetJobFile(request.JobId);
        if (file == null)
        {
            return Task.FromResult(Result.Failure<ReportFileResult>(
                new NotFoundError("ReportFile", request.JobId)));
        }

        return Task.FromResult(Result.Success(new ReportFileResult(
            file.Value.Content,
            file.Value.ContentType,
            file.Value.FileName)));
    }
}
