using FluentValidation;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.CreateFixedTimeBlock;

public sealed class CreateFixedTimeBlockValidator : AbstractValidator<CreateFixedTimeBlockCommand>
{
    public CreateFixedTimeBlockValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("BranchId không được để trống.");

        RuleFor(x => x.CourtTypeId)
            .NotEmpty().WithMessage("CourtTypeId không được để trống.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("Giờ kết thúc phải lớn hơn giờ bắt đầu.");

        RuleFor(x => x.DaysOfWeek)
            .NotEmpty().WithMessage("Phải chọn ít nhất một thứ trong tuần.")
            .Must(days => days.Distinct().Count() == days.Count)
            .WithMessage("Danh sách thứ trong tuần không được có phần tử trùng lặp.");

        RuleForEach(x => x.DaysOfWeek)
            .InclusiveBetween(0, 6)
            .WithMessage("Thứ trong tuần phải nằm trong khoảng 0 (Chủ nhật) đến 6 (Thứ bảy).");

        RuleFor(x => x.CourtIds)
            .NotEmpty().WithMessage("Phải chọn ít nhất một sân áp dụng khung giờ này.")
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("Danh sách sân áp dụng không được có phần tử trùng lặp.");
    }
}
