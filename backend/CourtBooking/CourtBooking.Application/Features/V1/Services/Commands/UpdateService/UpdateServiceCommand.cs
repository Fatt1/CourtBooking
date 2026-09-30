using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Services.Commands.UpdateService;

public sealed record UpdateServiceCommand(
    Guid Id,
    Guid CategoryId,
    string Name,
    string Unit,
    Guid? ImageId,
    List<ServiceBranchItemDto>? Branches) : ICommand;
