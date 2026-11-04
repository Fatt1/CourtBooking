using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Analytics.Reports.Models;
using CourtBooking.Application.Features.V1.Analytics.Reports.Services;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.Analytics.Reports.Queries.GetReportExportJob;

public sealed record GetReportExportJobQuery(Guid JobId) : IQuery<ReportJobResponseDto>;

internal sealed class GetReportExportJobQueryHandler(
    IReportJobManager jobManager,
    IUserContext userContext)
    : IQueryHandler<GetReportExportJobQuery, ReportJobResponseDto>
{
    public Task<Result<ReportJobResponseDto>> Handle(
        GetReportExportJobQuery request,
        CancellationToken cancellationToken)
    {
        var job = jobManager.GetJob(request.JobId);
        if (job == null)
        {
            return Task.FromResult(Result.Failure<ReportJobResponseDto>(
                new NotFoundError("ReportExportJob", request.JobId)));
        }

        if (userContext.UserId != Guid.Empty && job.CourtOwnerId != userContext.UserId)
        {
            return Task.FromResult(Result.Failure<ReportJobResponseDto>(
                new ForbiddenError("Bạn không có quyền truy cập báo cáo này.")));
        }

        var downloadUrl = job.Status == ReportExportStatus.Completed
            ? $"/api/v1/owner/analytics/reports/jobs/{job.JobId}/download"
            : null;

        var dto = new ReportJobResponseDto(
            job.JobId,
            job.Format.ToString(),
            job.Status.ToString(),
            job.FileName,
            downloadUrl,
            job.ErrorMessage,
            job.CreatedAt,
            job.CompletedAt);

        return Task.FromResult(Result.Success(dto));
    }
}
