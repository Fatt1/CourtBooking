using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Courts.Dtos;

public sealed record CourtDto
{
    public Guid Id { get; init; }
    public Guid CourtTypeId { get; init; }
    public string CourtTypeName { get; init; } = string.Empty;
    public Guid BranchId { get; init; }
    public string BranchName { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public CourtStatus Status { get; init; }
    public string StatusName => Status.ToString();
}

