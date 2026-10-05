using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranch;

public sealed record UpdateBranchCommand(
    Guid Id, string Name, string Hotline, string Province, string District, string Street,
    string GgMapUrl, TimeOnly OpenTime, TimeOnly CloseTime, Guid QrImageId,
    string AccountNumber, string AccountName, IReadOnlyList<Guid> SportTypeIds,
    string? Policy, decimal? Latitude, decimal? Longitude, IReadOnlyList<Guid>? ImageIds)
    : ICommand;
