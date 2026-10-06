using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.SportTypes.Commands.DeleteSportType;

public sealed record DeleteSportTypeCommand(Guid Id) : ICommand;
