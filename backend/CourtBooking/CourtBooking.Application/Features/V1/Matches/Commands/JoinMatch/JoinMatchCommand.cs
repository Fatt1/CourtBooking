using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Commands.JoinMatch;

public sealed record JoinMatchCommand(Guid MatchId) : ICommand<Guid>;
