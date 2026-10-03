using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Courts.Commands.DeleteCourt;

public sealed record DeleteCourtCommand(Guid Id) : ICommand;
