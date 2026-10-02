namespace CourtBooking.Application.Features.V1.SportTypes.Dtos;

public sealed record SportTypeDto(
    Guid Id,
    string Name,
    Guid? ImageId);