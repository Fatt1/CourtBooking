using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Commands.ApproveParticipant;

public sealed record ApproveParticipantCommand(
    Guid MatchId,
    Guid ParticipantId) : ICommand;
