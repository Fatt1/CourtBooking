using FluentValidation;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetPublicBranchById;

public sealed class GetPublicBranchByIdValidator : AbstractValidator<GetPublicBranchByIdQuery>
{
    public GetPublicBranchByIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Branch ID is required.");
    }
}
