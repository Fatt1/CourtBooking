using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.SubmitPaymentProof;

public sealed record SubmitPaymentProofCommand(
    Guid ImageId,
    Guid OrderId
    ) : ICommand;

