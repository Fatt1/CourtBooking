using FluentValidation;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetEventParticipants;

public sealed class GetEventParticipantsValidator : AbstractValidator<GetEventParticipantsQuery>
{
    public GetEventParticipantsValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty()
            .WithMessage("Id sự kiện không được để trống.");
    }
}
