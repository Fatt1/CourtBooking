using FluentValidation;

namespace CourtBooking.Application.Features.V1.Services.Commands.UpdateService;

public sealed class UpdateServiceValidator : AbstractValidator<UpdateServiceCommand>
{
    public UpdateServiceValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ServiceId không được để trống.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên dịch vụ không được để trống.")
            .MaximumLength(255).WithMessage("Tên dịch vụ không được vượt quá 255 ký tự.");

        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Đơn vị tính không được để trống.")
            .MaximumLength(50).WithMessage("Đơn vị tính không được vượt quá 50 ký tự.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Danh mục dịch vụ không được để trống.");

        When(x => x.Branches is not null, () =>
        {
            RuleForEach(x => x.Branches).ChildRules(b =>
            {
                b.RuleFor(x => x.BranchId)
                    .NotEmpty().WithMessage("BranchId không được để trống.");

                b.RuleFor(x => x.Price)
                    .GreaterThanOrEqualTo(0).WithMessage("Giá dịch vụ phải lớn hơn hoặc bằng 0.");
            });
        });

        When(x => x.BranchIds is not null, () =>
        {
            RuleForEach(x => x.BranchIds)
                .NotEmpty().WithMessage("BranchId không được để trống.");
        });
    }
}
