using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Commands.DeleteBranch;

public sealed record DeleteBranchCommand(Guid Id) : ICommand;
