using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.CreateOrderOnline;

public sealed class CreateOrderOnlineValidator : AbstractValidator<CreateOrderOnlineCommand>
{
    public CreateOrderOnlineValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("Chi nhánh không được để trống.");

        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Tên khách hàng không được để trống.")
            .MaximumLength(255).WithMessage("Tên khách hàng không được vượt quá 255 ký tự.");

        RuleFor(x => x.CustomerPhone)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches(@"^(0|\+84)[0-9]{9,10}$").WithMessage("Số điện thoại không đúng định dạng hợp lệ.");

        When(x => !string.IsNullOrWhiteSpace(x.Note), () =>
        {
            RuleFor(x => x.Note)
                .MaximumLength(500).WithMessage("Ghi chú không được vượt quá 500 ký tự.");
        });

        RuleFor(x => x.CourtSlots)
            .NotEmpty().WithMessage("Đơn đặt sân phải có ít nhất một nhóm đặt sân.");


        RuleForEach(x => x.CourtSlots).ChildRules(group =>
        {
            group.RuleFor(g => g.CourtTypeId)
                .NotEmpty().WithMessage("Loại sân (CourtTypeId) không được để trống.");

            group.RuleFor(g => g.PriceTableId)
                .NotEmpty().WithMessage("Bảng giá (PriceTableId) không được để trống.");

            group.RuleFor(g => g.Slots)
                .NotEmpty().WithMessage("Mỗi loại sân phải có ít nhất một khung giờ đặt.");

            group.RuleForEach(g => g.Slots).ChildRules(slot =>
            {
                slot.RuleFor(s => s.CourtId)
                    .NotEmpty().WithMessage("CourtId không được để trống.");

                slot.RuleFor(s => s.Date)
                    .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.Date))
                    .WithMessage("Ngày đặt sân không thể ở trong quá khứ.");

                slot.RuleFor(s => s.EndTime)
                    .GreaterThan(s => s.StartTime)
                    .WithMessage("Giờ kết thúc phải sau giờ bắt đầu.");
            });
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
