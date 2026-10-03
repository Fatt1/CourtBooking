using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Commands.RejectParticipant;

public sealed record RejectParticipantCommand(
    Guid MatchId,
    Guid ParticipantId,
    Guid? HostId = null) : ICommand;
