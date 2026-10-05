namespace CourtBooking.Application.Features.V1.CourtTypes.Dtos;

public sealed record CourtTypeDto(
    Guid Id,
    Guid BranchId,
    string Name,
    int MinutesConfig);
