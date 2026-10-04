using FluentValidation;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderServices;

public sealed class UpdateOrderServicesValidator : AbstractValidator<UpdateOrderServicesCommand>
{
    public UpdateOrderServicesValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("OrderId không được để trống.");

        When(x => x.Services != null && x.Services.Count > 0, () =>
        {
            RuleForEach(x => x.Services!)
                .ChildRules(item =>
                {
                    item.RuleFor(s => s.ServiceId)
                        .NotEmpty().WithMessage("ServiceId không được để trống.");

                    item.RuleFor(s => s.Quantity)
                        .GreaterThan(0).WithMessage("Số lượng dịch vụ phải lớn hơn 0.");
                });

            RuleFor(x => x.Services!)
                .Must(services => services.Select(s => s.ServiceId).Distinct().Count() == services.Count)
                .WithMessage("Danh sách dịch vụ không được chứa các mục trùng lặp ServiceId.");
        });
    }
}
