using CourtBooking.Application.Features.V1.Services.Dtos;

namespace CourtBooking.API.Endpoints.V1.Services;

public sealed record CreateServiceRequest(
    Guid CategoryId,
    string Name,
    string Unit,
    Guid? ImageId,
    List<ServiceBranchItemDto> Branches);
