using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Storages.Commands.UploadImage;

public sealed record UploadImageCommand(
    Stream FileStream,
    string FileName,
    string ContentType,
    long SizeBytes) : ICommand<UploadImageResponse>;

public sealed record UploadImageResponse(
    Guid Id,
    string OriginalFileName,
    string ContentType,
    long SizeBytes,
    Uri Url);
