using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourt;

public sealed record UpdateCourtCommand(
    Guid Id,
    Guid? CourtTypeId,
    string Name) : ICommand;
