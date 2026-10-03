using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.CreateEvent;

/// <summary>
/// Command tạo sự kiện mới, đồng thời tự động tạo Order khóa cứng các sân con trên Time Grid.
/// </summary>
public sealed record CreateEventCommand(
    Guid BranchId,
    string Title,
    Guid SportTypeId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal TicketPrice,
    int Slots,
    string? SkillLevelFrom,
    string? SkillLevelTo,
    string? Description,
    List<Guid> CourtIds) : ICommand<Guid>;
