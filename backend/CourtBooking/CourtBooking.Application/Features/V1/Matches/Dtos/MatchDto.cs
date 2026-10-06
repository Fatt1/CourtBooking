using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Matches.Dtos;

public sealed record MatchDto(
    Guid Id,
    Guid OrderId,
    Guid BranchId,
    string BranchName,
    string BranchAddress,
    Guid SportTypeId,
    string SportTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    Guid HostId,
    string HostName,
    string? SkillLevel,
    int MissingPlayers,
    int AvailableSlots,
    decimal FeePerPlayer,
    byte ApprovalMode,
    SocialMatchStatus Status,
    string? Description,
    DateTime CreatedAt,
    int ConfirmedParticipantsCount);

public sealed record MatchDetailDto(
    Guid Id,
    Guid OrderId,
    string OrderCode,
    Guid BranchId,
    string BranchName,
    string BranchAddress,
    Guid SportTypeId,
    string SportTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    Guid HostId,
    string HostName,
    string? SkillLevel,
    int MissingPlayers,
    int AvailableSlots,
    decimal FeePerPlayer,
    byte ApprovalMode,
    SocialMatchStatus Status,
    string? Description,
    DateTime CreatedAt,
    List<MatchParticipantDto> Participants);

public sealed record MatchParticipantDto(
    Guid Id,
    Guid PlayerId,
    string PlayerName,
    ParticipantStatus Status,
    DateTime JoinedAt,
    bool IsHost);

public sealed record CreateMatchResponse(Guid MatchId);

public sealed record JoinMatchResponse(Guid ParticipantId);
