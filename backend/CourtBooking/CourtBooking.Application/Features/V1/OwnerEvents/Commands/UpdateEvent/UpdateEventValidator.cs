using FluentValidation;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.UpdateEvent;

public sealed class UpdateEventValidator : AbstractValidator<UpdateEventCommand>
{
    public UpdateEventValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty()
            .WithMessage("Id sự kiện không được để trống.");

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Tên sự kiện không được để trống.")
            .MaximumLength(255)
            .WithMessage("Tên sự kiện tối đa 255 ký tự.");

        RuleFor(x => x.TicketPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Giá vé không thể là số âm.");

        RuleFor(x => x.Slots)
            .GreaterThan(0)
            .WithMessage("Số lượng vé tối đa (Slots) phải lớn hơn 0.");
    }
}
