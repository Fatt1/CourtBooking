using FluentValidation;

namespace CourtBooking.Application.Features.V1.Analytics.Queries.GetSaaSSubscriptionRevenue;

public sealed class GetSaaSSubscriptionRevenueValidator : AbstractValidator<GetSaaSSubscriptionRevenueQuery>
{
    public GetSaaSSubscriptionRevenueValidator()
    {
        RuleFor(x => x)
            .Must(x => !x.FromDate.HasValue || !x.ToDate.HasValue || x.FromDate.Value <= x.ToDate.Value)
            .WithMessage("Ngày bắt đầu (FromDate) phải nhỏ hơn hoặc bằng ngày kết thúc (ToDate).");

        RuleFor(x => x.GroupBy)
            .IsInEnum()
            .WithMessage("Hình thức gom nhóm thời gian (GroupBy) không hợp lệ (hỗ trợ Day, Month, Year).");
    }
}
