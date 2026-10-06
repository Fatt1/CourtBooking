using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourtStatus;

public sealed record UpdateCourtStatusCommand(
    Guid Id,
    CourtStatus Status) : ICommand;
