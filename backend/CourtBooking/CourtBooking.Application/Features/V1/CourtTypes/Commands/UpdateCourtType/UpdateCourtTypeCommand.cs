using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.CourtTypes.Commands.UpdateCourtType;

public sealed record UpdateCourtTypeCommand(
    Guid Id,
    string Name,
    int MinutesConfig) : ICommand;
