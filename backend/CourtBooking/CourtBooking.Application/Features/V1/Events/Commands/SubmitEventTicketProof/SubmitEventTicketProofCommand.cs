using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Events.Commands.SubmitEventTicketProof;

/// <summary>
/// Command gửi bằng chứng chuyển khoản thanh toán cho vé sự kiện.
/// </summary>
public sealed record SubmitEventTicketProofCommand(
    Guid EventId,
    Guid TicketId,
    Guid ProofImageId) : ICommand;
