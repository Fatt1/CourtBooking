using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Services.Commands.DeleteService;

public sealed record DeleteServiceCommand(
    Guid ServiceId
    ) : ICommand;
