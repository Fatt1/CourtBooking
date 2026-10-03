using FluentValidation;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetOwnerEventById;

public sealed class GetOwnerEventByIdValidator : AbstractValidator<GetOwnerEventByIdQuery>
{
    public GetOwnerEventByIdValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty()
            .WithMessage("Id sự kiện không được để trống.");
    }
}
