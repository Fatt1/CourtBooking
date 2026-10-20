using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Commands.DeleteMatch;

public sealed record DeleteMatchCommand(Guid MatchId) : ICommand;
