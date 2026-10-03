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
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Ngày tổ chức sự kiện không thể ở quá khứ.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("Giờ kết thúc phải sau giờ bắt đầu.");

        RuleFor(x => x.TicketPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Giá vé không thể là số âm.");

        RuleFor(x => x.Slots)
            .GreaterThan(0)
            .WithMessage("Số lượng vé tối đa (Slots) phải lớn hơn 0.");

        RuleFor(x => x.CourtIds)
            .NotEmpty()
            .WithMessage("Phải chọn ít nhất 1 sân con để tổ chức sự kiện.")
            .Must(courts => courts != null && courts.Count > 0 && courts.Distinct().Count() == courts.Count)
            .WithMessage("Danh sách sân con không được trùng lặp.");
    }
}
