using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.UpdateEvent;

/// <summary>
/// Command cập nhật thông tin sự kiện (Modal "Cập nhật sự kiện").
/// </summary>
public sealed record UpdateEventCommand(
    Guid EventId,
    string Title,
    Guid SportTypeId,
    decimal TicketPrice,
    int Slots,
    EventStatus Status,
    string? SkillLevelFrom = null,
    string? SkillLevelTo = null,
    string? Description = null,
    string? Note = null) : ICommand;
