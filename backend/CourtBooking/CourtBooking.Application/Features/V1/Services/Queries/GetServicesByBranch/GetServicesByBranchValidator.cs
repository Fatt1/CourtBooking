using FluentValidation;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetServicesByBranch;

public sealed class GetServicesByBranchValidator : AbstractValidator<GetServicesByBranchQuery>
{
    public GetServicesByBranchValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty()
            .WithMessage("BranchId is required.");


    }
}
