using CourtBooking.Application.Features.V1.Storages.Dtos;

namespace CourtBooking.Application.Features.V1.SportTypes.Dtos;

public sealed record SportTypeDto(
    Guid Id,
    string Name,
    ImageDto? Image,
    int BranchCount);

public sealed record AdminSportTypeDto(
    Guid Id,
    string Name,
    Guid? ImageId,
    int BranchCount);
