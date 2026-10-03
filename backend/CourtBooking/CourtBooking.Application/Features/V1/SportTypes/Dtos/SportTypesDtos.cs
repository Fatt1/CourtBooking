using CourtBooking.Application.Features.V1.Services.Dtos;

namespace CourtBooking.Application.Features.V1.SportTypes.Dtos;

public sealed record SportTypeDto(
    Guid Id,
    string Name,
    ImageDto? Image);

public sealed record AdminSportTypeDto(
    Guid Id,
    string Name,
    Guid? ImageId,
    int BranchCount);