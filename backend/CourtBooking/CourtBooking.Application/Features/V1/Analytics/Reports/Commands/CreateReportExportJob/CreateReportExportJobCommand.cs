using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Analytics.Reports.Models;
using CourtBooking.Application.Features.V1.Analytics.Reports.Services;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.Analytics.Reports.Commands.CreateReportExportJob;

public sealed record CreateReportExportJobCommand(
    DateOnly FromDate,
    DateOnly ToDate,
    Guid? BranchId = null,
    ReportExportFormat Format = ReportExportFormat.Pdf) : ICommand<ReportJobResponseDto>;

internal sealed class CreateReportExportJobCommandHandler(
    IReportJobManager jobManager,
    IBackgroundReportQueue queue,
    IBranchAuthorizationService branchAuth,
    IUserContext userContext)
    : ICommandHandler<CreateReportExportJobCommand, ReportJobResponseDto>
{
    public async Task<Result<ReportJobResponseDto>> Handle(
        CreateReportExportJobCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;
        if (currentUserId == Guid.Empty)
        {
            return Result.Failure<ReportJobResponseDto>(
                new ForbiddenError("Người dùng chưa được xác thực hoặc không tìm thấy thông tin chủ sân."));
        }

        if (request.FromDate > request.ToDate)
        {
            return Result.Failure<ReportJobResponseDto>(
                new BadError("Ngày bắt đầu (FromDate) phải nhỏ hơn hoặc bằng ngày kết thúc (ToDate)."));
        }

        if (request.BranchId.HasValue)
        {
            var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId.Value, cancellationToken);
            if (authResult.IsFailure)
            {
                return Result.Failure<ReportJobResponseDto>(authResult.Error!);
            }
        }

        var job = jobManager.CreateJob(
            currentUserId,
            request.Format,
            request.FromDate,
            request.ToDate,
            request.BranchId);

        await queue.EnqueueAsync(job.JobId, cancellationToken);

        var downloadUrl = $"/api/v1/owner/analytics/reports/jobs/{job.JobId}/download";

        return Result.Success(new ReportJobResponseDto(
            job.JobId,
            job.Format.ToString(),
            job.Status.ToString(),
            job.FileName,
            downloadUrl,
            job.ErrorMessage,
            job.CreatedAt,
            job.CompletedAt));
    }
}

