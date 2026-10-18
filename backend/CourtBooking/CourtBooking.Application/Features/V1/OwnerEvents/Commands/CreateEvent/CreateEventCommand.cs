using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.CreateEvent;

/// <summary>
/// Command tạo sự kiện mới, đồng thời tự động tạo Order khóa cứng các sân con trên Time Grid.
/// </summary>
public sealed record CreateEventCommand(
    Guid BranchId,
    string Title,
    Guid SportTypeId,
    decimal TicketPrice,
    int Slots,
    List<CourtBookingSlot> CourtSlots,
    DateOnly? Date = null,
    TimeOnly? StartTime = null,
    TimeOnly? EndTime = null,
    string? SkillLevelFrom = null,
    string? SkillLevelTo = null,
    string? Description = null,
    string? CustomerName = null,
    string? CustomerPhone = null,
    string? Note = null) : ICommand<Guid>;
