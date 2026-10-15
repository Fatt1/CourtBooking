using FluentValidation;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetFromTimeBooking;

public sealed class GetFromTimeBookingValidator : AbstractValidator<GetFromTimeBookingQuery>
{
    public GetFromTimeBookingValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("Chi nhánh không được để trống.");

        RuleFor(x => x.FromDate)
            .NotEmpty().WithMessage("Ngày bắt đầu không được để trống.");

        RuleFor(x => x.ToDate)
            .NotEmpty().WithMessage("Ngày kết thúc không được để trống.");

        RuleFor(x => x)
            .Must(x => x.ToDate >= x.FromDate)
            .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");

        RuleFor(x => x)
            .Must(x => (x.ToDate.DayNumber - x.FromDate.DayNumber) <= 31)
            .WithMessage("Khoảng thời gian tra cứu không được vượt quá 1 tháng (tối đa 31 ngày).");
    }
}
