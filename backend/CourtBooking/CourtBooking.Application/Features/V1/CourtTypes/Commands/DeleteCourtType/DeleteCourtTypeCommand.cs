using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.CourtTypes.Commands.DeleteCourtType;

public sealed record DeleteCourtTypeCommand(
    Guid Id) : ICommand;
