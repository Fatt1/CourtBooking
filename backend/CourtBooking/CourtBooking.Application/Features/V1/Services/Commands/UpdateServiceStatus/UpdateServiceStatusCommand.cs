using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Services.Commands.UpdateServiceStatus;

public sealed record UpdateServiceStatusCommand(Guid ServiceId, Guid BranchId, bool IsActive) : ICommand;
