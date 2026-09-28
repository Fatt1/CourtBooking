using CourtBooking.API.Extensions;
using CourtBooking.Application.Abstractions.Storage;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Storage;

public sealed class StorageEndpoints : IEndpointGroup
{
    private const string StorageTag = "Storage";

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("storage");

        // POST /api/v1/storage/upload-image
        group.MapPost("/upload-image", async (
                [FromForm] IFormFile? file,
                IStorageService storageService,
                CancellationToken ct) =>
            {
                if (file is null || file.Length == 0)
                {
                    return Results.BadRequest(new ProblemDetails
                    {
                        Title = "Invalid file",
                        Detail = "Please upload a valid image file.",
                        Status = StatusCodes.Status400BadRequest
                    });
                }

                // Check file extension
                var extension = Path.GetExtension(file.FileName);
                if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                {
                    return Results.BadRequest(new ProblemDetails
                    {
                        Title = "Invalid file type",
                        Detail = $"Allowed image types: {string.Join(", ", AllowedExtensions)}",
                        Status = StatusCodes.Status400BadRequest
                    });
                }

                // Validate content-type
                if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.BadRequest(new ProblemDetails
                    {
                        Title = "Invalid content type",
                        Detail = "The uploaded file is not recognized as an image.",
                        Status = StatusCodes.Status400BadRequest
                    });
                }

                // Max file size: 10MB
                const long maxFileSize = 10 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    return Results.BadRequest(new ProblemDetails
                    {
                        Title = "File size limit exceeded",
                        Detail = "Image file must not exceed 10MB.",
                        Status = StatusCodes.Status400BadRequest
                    });
                }

                var key = $"images/{Guid.NewGuid()}{extension.ToLower(System.Globalization.CultureInfo.InvariantCulture)}";

                await using var stream = file.OpenReadStream();
                var uploadedKey = await storageService.UploadAsync(
                    stream,
                    key,
                    file.ContentType,
                    cancellationToken: ct);

                var presignedUrl = await storageService.GetPresignedUrlAsync(
                    uploadedKey,
                    expiryInSeconds: 3600,
                    cancellationToken: ct);

                var response = new UploadImageResponse(
                    Key: uploadedKey,
                    OriginalFileName: file.FileName,
                    ContentType: file.ContentType,
                    SizeBytes: file.Length,
                    Url: new Uri(presignedUrl));

                return Results.Ok(response);
            })
            .DisableAntiforgery()
            .WithName("UploadImage")
            .WithSummary("Upload an image to SeaweedFS/S3 storage")
            .WithDescription("Accepts multipart/form-data with a single image file (JPG, PNG, WEBP, GIF, max 10MB).")
            .WithTags(StorageTag)
            .Produces<UploadImageResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}

public sealed record UploadImageResponse(
    string Key,
    string OriginalFileName,
    string ContentType,
    long SizeBytes,
    Uri Url);

