using FluentValidation;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetPublicBranchById;

public sealed class GetPublicBranchByIdValidator : AbstractValidator<GetPublicBranchByIdQuery>
{
    public GetPublicBranchByIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Branch ID is required.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90m, 90m).When(x => x.Latitude.HasValue)
            .WithMessage("Vĩ độ (latitude) phải nằm trong khoảng từ -90 đến 90.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180m, 180m).When(x => x.Longitude.HasValue)
            .WithMessage("Kinh độ (longitude) phải nằm trong khoảng từ -180 đến 180.");

        RuleFor(x => x)
            .Must(x => (x.Latitude.HasValue && x.Longitude.HasValue) || (!x.Latitude.HasValue && !x.Longitude.HasValue))
            .WithMessage("Nếu cung cấp tọa độ thì phải truyền đủ cả latitude và longitude.");
    }
}
