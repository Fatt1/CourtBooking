using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.CreateFixedOrderByOwner;

public sealed class CreateFixedOrderByOwnerValidator : AbstractValidator<CreateFixedOrderByOwnerCommand>
{
    public CreateFixedOrderByOwnerValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("Chi nhánh không được để trống.");

        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Tên khách hàng không được để trống.")
            .MaximumLength(255).WithMessage("Tên khách hàng không được vượt quá 255 ký tự.");

        RuleFor(x => x.CustomerPhone)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches(@"^(0|\+84)[0-9]{9,10}$").WithMessage("Số điện thoại không đúng định dạng hợp lệ.");

        RuleFor(x => x.DiscountAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Số tiền giảm giá không được âm.");

        When(x => !string.IsNullOrWhiteSpace(x.Note), () =>
        {
            RuleFor(x => x.Note)
                .MaximumLength(500).WithMessage("Ghi chú không được vượt quá 500 ký tự.");
        });

        RuleFor(x => x.Cycles)
            .NotEmpty().WithMessage("Đơn đặt lịch cố định phải có ít nhất một chu kì.");

        RuleForEach(x => x.Cycles).ChildRules(cycle =>
        {
            cycle.RuleFor(c => c.CourtTypeId)
                .NotEmpty().WithMessage("CourtTypeId không được để trống.");

            cycle.RuleFor(c => c.PriceTableId)
                .NotEmpty().WithMessage("PriceTableId không được để trống.");

            cycle.RuleFor(c => c.StartDate)
                .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.Date))
                .WithMessage("Ngày bắt đầu chu kì không thể ở trong quá khứ.");

            cycle.RuleFor(c => c.EndDate)
                .GreaterThanOrEqualTo(c => c.StartDate)
                .WithMessage("Ngày kết thúc chu kì phải lớn hơn hoặc bằng ngày bắt đầu.");

            cycle.RuleFor(c => c.DaysOfWeekMask)
                .InclusiveBetween(1, 127)
                .WithMessage("Bitmask thứ trong tuần không hợp lệ (phải từ 1 đến 127).");

            cycle.RuleFor(c => c.EndTime)
                .GreaterThan(c => c.StartTime)
                .WithMessage("Giờ kết thúc phải sau giờ bắt đầu.");

            cycle.RuleFor(c => c.CourtIds)
                .NotEmpty().WithMessage("Mỗi chu kì phải chọn ít nhất một sân.");

            cycle.RuleForEach(c => c.CourtIds)
                .NotEmpty().WithMessage("CourtId không được để trống.");
        });

        When(x => x.Services != null && x.Services.Count > 0, () =>
        {
            RuleFor(x => x.Services!)
                .Must(services => services.Select(s => s.ServiceId).Distinct().Count() == services.Count)
                .WithMessage("Danh sách dịch vụ đính kèm không được trùng lặp dịch vụ.");

            RuleForEach(x => x.Services!).ChildRules(service =>
            {
                service.RuleFor(s => s.ServiceId)
                    .NotEmpty().WithMessage("ServiceId không được để trống.");

                service.RuleFor(s => s.Quantity)
                    .GreaterThan(0).WithMessage("Số lượng dịch vụ phải lớn hơn 0.");
            });
        });
    }
}
