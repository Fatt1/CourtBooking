using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportType;

public sealed record UpdateSportTypeCommand(
    Guid Id,
    string Name,
    Guid? ImageId) : ICommand;