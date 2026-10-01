using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderDetail;

public sealed class UpdateOrderDetailValidator : AbstractValidator<UpdateOrderDetailCommand>
{
    public UpdateOrderDetailValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Mã đơn hàng (OrderId) không được để trống.");

        RuleFor(x => x.CourtBookingSlots)
            .NotEmpty().WithMessage("Đơn đặt sân phải có ít nhất một nhóm đặt sân.");

        RuleForEach(x => x.CourtBookingSlots).ChildRules(group =>
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
    }
}
