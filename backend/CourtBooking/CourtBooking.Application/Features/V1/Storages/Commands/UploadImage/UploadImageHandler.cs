using System.Diagnostics.CodeAnalysis;
using CourtBooking.Application.Abstractions.Storage;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.Storages.Commands.UploadImage;

public sealed class UploadImageHandler : ICommandHandler<UploadImageCommand, UploadImageResponse>
{
    private readonly IStorageService _storageService;
    private readonly IApplicationDbContext _applicationDbContext;

    public UploadImageHandler(
        IStorageService storageService,
        IApplicationDbContext applicationDbContext)
    {
        _storageService = storageService;
        _applicationDbContext = applicationDbContext;
    }

    [SuppressMessage("Globalization", "CA1308:Normalize strings to uppercase", Justification = "Object storage file extensions are conventionally lowercase for web URLs.")]
    public async Task<Result<UploadImageResponse>> Handle(
        UploadImageCommand request,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(request.FileName);
        var key = $"images/{Guid.NewGuid()}{extension.ToLowerInvariant()}";

        var uploadedKey = await _storageService.UploadAsync(
            request.FileStream,
            key,
            request.ContentType,
            cancellationToken: cancellationToken);

        var presignedUrl = await _storageService.GetPresignedUrlAsync(
            uploadedKey,
            expiryInSeconds: 3600,
            cancellationToken: cancellationToken);

        var image = Image.Create(StorageProvider.S3, uploadedKey);
        _applicationDbContext.Images.Add(image);
        await _applicationDbContext.SaveChangesAsync(cancellationToken);

        var response = new UploadImageResponse(
            Id: image.Id,
            OriginalFileName: request.FileName,
            ContentType: request.ContentType,
            SizeBytes: request.SizeBytes,
            Url: new Uri(presignedUrl));

        return Result.Success(response);
    }
}
