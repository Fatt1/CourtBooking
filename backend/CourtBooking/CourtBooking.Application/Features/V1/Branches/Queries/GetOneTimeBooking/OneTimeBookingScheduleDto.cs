namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOneTimeBooking;

public enum TimelineSlotStatus
{
    Available = 0,
    Booked = 1,
    Locked = 2,
    Event = 3
}

public sealed record OccupiedSlotDto(
    Guid CourtId,
    string CourtName,
    TimeOnly StartTime,
    TimeOnly EndTime,
    TimelineSlotStatus Status,
    string? OrderCode,
    string? CustomerName,
    string? Title);

public sealed record CourtTimelineItemDto(
    Guid CourtId,
    Guid CourtTypeId,
    string CourtTypeName,
    string CourtName,
    bool IsMaintenance);

public sealed record OneTimeBookingScheduleDto(
    Guid BranchId,
    string BranchName,
    DateOnly Date,
    TimeOnly OpenTime,
    TimeOnly CloseTime,
    IReadOnlyList<CourtTimelineItemDto> Courts,
    IReadOnlyList<OccupiedSlotDto> OccupiedSlots);
