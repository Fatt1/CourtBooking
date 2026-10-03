using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.CourtTypes.Commands.CreateCourtType;

public sealed record CreateCourtTypeCommand(
    Guid BranchId,
    string Name,
    int MinutesConfig) : ICommand<Guid>;
