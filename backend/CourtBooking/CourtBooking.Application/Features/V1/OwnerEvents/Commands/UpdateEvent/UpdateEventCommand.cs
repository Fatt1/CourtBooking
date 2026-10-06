using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.UpdateEvent;

/// <summary>
/// Command cập nhật thông tin sự kiện (Modal "Cập nhật sự kiện").
/// </summary>
public sealed record UpdateEventCommand(
    Guid EventId,
    string Title,
    decimal TicketPrice,
    int Slots,
    string? SkillLevelFrom,
    string? SkillLevelTo,
    string? Description) : ICommand;
