using FluentValidation;

namespace CourtBooking.Application.Features.V1.Analytics.Queries.GetSystemUtilizationStatistics;

public sealed class GetSystemUtilizationStatisticsValidator : AbstractValidator<GetSystemUtilizationStatisticsQuery>
{
    public GetSystemUtilizationStatisticsValidator()
    {
        RuleFor(x => x)
            .Must(x => !x.FromDate.HasValue || !x.ToDate.HasValue || x.FromDate.Value <= x.ToDate.Value)
            .WithMessage("Ngày bắt đầu (FromDate) phải nhỏ hơn hoặc bằng ngày kết thúc (ToDate).");
    }
}
