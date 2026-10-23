using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Commands.CreateBranch;

public sealed record CreateBranchCommand(
    string Name, string Hotline, string Province, string District, string Street,
    string? GgMapUrl, TimeOnly OpenTime, TimeOnly CloseTime, Guid QrImageId,
    string AccountNumber, string AccountName, IReadOnlyList<Guid> SportTypeIds,
    string? Policy, decimal? Latitude, decimal? Longitude, IReadOnlyList<Guid>? ImageIds,
    string? Description = null, string? BankName = null, string? BankCode = null)
    : ICommand<Guid>;
