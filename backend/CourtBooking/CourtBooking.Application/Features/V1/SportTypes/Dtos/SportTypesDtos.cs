namespace CourtBooking.Application.Features.V1.SportTypes.Dtos;

public sealed record SportTypeDto(
    Guid Id,
    string Name,
    Guid? ImageId);

public sealed record AdminSportTypeDto(
    Guid Id,
    string Name,
    Guid? ImageId,
    bool IsActive,
    int BranchCount);