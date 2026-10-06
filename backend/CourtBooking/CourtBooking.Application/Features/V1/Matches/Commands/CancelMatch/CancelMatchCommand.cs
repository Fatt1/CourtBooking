using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Commands.CancelMatch;

public sealed record CancelMatchCommand(Guid MatchId) : ICommand;
