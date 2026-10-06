using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Courts.Commands.CreateCourt;

public sealed record CreateCourtCommand(
    Guid CourtTypeId,
    string Name) : ICommand<Guid>;
