using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Services.Commands.CreateService;

public sealed record CreateServiceCommand(
    Guid CategoryId,
    string Name,
    string Unit,
    Guid? ImageId,
    List<ServiceBranchItemDto> Branches) : ICommand<Guid>;
