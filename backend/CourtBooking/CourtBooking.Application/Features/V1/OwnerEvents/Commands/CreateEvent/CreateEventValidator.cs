using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using FluentValidation;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.CreateEvent;

public sealed class CreateEventValidator : AbstractValidator<CreateEventCommand>
{
    public CreateEventValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty()
            .WithMessage("Id chi nhánh không được để trống.");

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Tên sự kiện không được để trống.")
            .MaximumLength(255)
            .WithMessage("Tên sự kiện tối đa 255 ký tự.");

        RuleFor(x => x.SportTypeId)
            .NotEmpty()
            .WithMessage("Môn thể thao không được để trống.");

        RuleFor(x => x.Date)
            .NotEmpty()
            .WithMessage("Ngày diễn ra sự kiện không được để trống.");

        RuleFor(x => x.StartTime)
            .NotEmpty()
            .WithMessage("Giờ bắt đầu không được để trống.");

        RuleFor(x => x.EndTime)
            .NotEmpty()
            .WithMessage("Giờ kết thúc không được để trống.")
            .GreaterThan(x => x.StartTime)
            .WithMessage("Giờ kết thúc phải sau giờ bắt đầu.");

        RuleFor(x => x.TicketPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Giá vé không thể là số âm.");

        RuleFor(x => x.Slots)
            .GreaterThan(0)
            .WithMessage("Số lượng vé tối đa (Slots) phải lớn hơn 0.");

        RuleFor(x => x.CourtSlots)
            .NotEmpty()
            .WithMessage("Sự kiện phải có ít nhất một nhóm đặt sân.");

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

        When(x => !string.IsNullOrWhiteSpace(x.CustomerPhone), () =>
        {
            RuleFor(x => x.CustomerPhone)
                .Matches(@"^(0|\+84)[0-9]{9,10}$").WithMessage("Số điện thoại không đúng định dạng hợp lệ.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.Note), () =>
        {
            RuleFor(x => x.Note)
                .MaximumLength(500).WithMessage("Ghi chú không được vượt quá 500 ký tự.");
        });
    }
}
