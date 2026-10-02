using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportTypeStatus;

public sealed record UpdateSportTypeStatusCommand(
    Guid Id,
    bool IsActive) : ICommand;