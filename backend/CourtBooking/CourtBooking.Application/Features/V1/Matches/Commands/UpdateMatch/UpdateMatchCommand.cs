using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Commands.UpdateMatch;

public sealed record UpdateMatchCommand(
    Guid Id,
    string? SkillLevel,
    int MissingPlayers,
    decimal FeePerPlayer,
    byte ApprovalMode,
    string? Description) : ICommand;
