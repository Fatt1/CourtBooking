using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Matches.Commands.CreateMatch;

public sealed record CreateMatchCommand(
    Guid OrderId,
    string? SkillLevel,
    int MissingPlayers,
    decimal FeePerPlayer,
    byte ApprovalMode,
    string? Description,
    Guid? HostId = null) : ICommand<Guid>;
