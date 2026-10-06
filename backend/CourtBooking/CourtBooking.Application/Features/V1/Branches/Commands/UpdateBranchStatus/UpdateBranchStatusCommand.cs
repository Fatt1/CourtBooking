using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranchStatus;

public sealed record UpdateBranchStatusCommand(Guid Id, bool IsActive) : ICommand;
