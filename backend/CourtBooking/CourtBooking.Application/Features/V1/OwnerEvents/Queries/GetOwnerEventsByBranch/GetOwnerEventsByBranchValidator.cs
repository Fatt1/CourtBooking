using FluentValidation;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetOwnerEventsByBranch;

public sealed class GetOwnerEventsByBranchValidator : AbstractValidator<GetOwnerEventsByBranchQuery>
{
    public GetOwnerEventsByBranchValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty()
            .WithMessage("Id chi nhánh không được để trống.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Trang hiện tại (Page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Số lượng sự kiện mỗi trang (PageSize) phải từ 1 đến 100.");
    }
}
