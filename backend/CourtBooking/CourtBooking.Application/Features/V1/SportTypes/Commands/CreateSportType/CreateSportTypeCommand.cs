using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;

public sealed record CreateSportTypeCommand(
    string Name,
    Guid ImageId) : ICommand<Guid>;
