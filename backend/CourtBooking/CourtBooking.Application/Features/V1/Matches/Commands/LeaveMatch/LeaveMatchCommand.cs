using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Commands.LeaveMatch;

public sealed record LeaveMatchCommand(Guid MatchId) : ICommand;
