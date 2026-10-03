using FluentValidation;

namespace CourtBooking.Application.Features.V1.Events.Queries.GetPublicEventById;

public sealed class GetPublicEventByIdValidator : AbstractValidator<GetPublicEventByIdQuery>
{
    public GetPublicEventByIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id sự kiện không được để trống.");
    }
}
