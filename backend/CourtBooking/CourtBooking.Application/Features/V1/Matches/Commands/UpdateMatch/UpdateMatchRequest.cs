namespace CourtBooking.Application.Features.V1.Matches.Commands.UpdateMatch;

public sealed record UpdateMatchRequest(
    string? SkillLevel,
    int MissingPlayers,
    decimal FeePerPlayer,
    byte ApprovalMode,
    string? Description);
