using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.AddOrderSlots;

public sealed class AddOrderSlotsValidator : AbstractValidator<AddOrderSlotsCommand>
{
    public AddOrderSlotsValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty().WithMessage("Mã đơn hàng không được để trống.");
        RuleFor(x => x.CourtSlots).NotEmpty().WithMessage("Danh sách ca sân thêm mới không được rỗng.");
    }
}
