using FluentValidation;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetServiceById;

public sealed class GetServiceByIdValidator : AbstractValidator<GetServiceByIdQuery>
{
    public GetServiceByIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ServiceId không được để trống.");
    }
}
