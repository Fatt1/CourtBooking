using FluentValidation;

namespace CourtBooking.Application.Features.V1.Events.Commands.SubmitEventTicketProof;

public sealed class SubmitEventTicketProofValidator : AbstractValidator<SubmitEventTicketProofCommand>
{
    public SubmitEventTicketProofValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty()
            .WithMessage("Id sự kiện không được để trống.");

        RuleFor(x => x.TicketId)
            .NotEmpty()
            .WithMessage("Id vé không được để trống.");

        RuleFor(x => x.ProofImageId)
            .NotEmpty()
            .WithMessage("Hình ảnh bằng chứng chuyển khoản không được để trống.");
    }
}
