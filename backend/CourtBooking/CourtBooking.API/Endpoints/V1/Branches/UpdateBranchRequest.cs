namespace CourtBooking.API.Endpoints.V1.Branches;

public sealed record UpdateBranchRequest(
    string Name, string Hotline, string Province, string District, string Street,
    string GgMapUrl, TimeOnly OpenTime, TimeOnly CloseTime, Guid QrImageId,
    string AccountNumber, string AccountName, IReadOnlyList<Guid> SportTypeIds,
    string? Policy, decimal? Latitude, decimal? Longitude, IReadOnlyList<Guid>? ImageIds);
