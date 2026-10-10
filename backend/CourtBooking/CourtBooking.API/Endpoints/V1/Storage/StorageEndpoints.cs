using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Storages.Commands.UploadImage;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Storage;

public sealed class StorageEndpoints : IEndpointGroup
{
    private const string StorageTag = "Storage";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("storage");



        // POST /api/v1/storage/upload
        group.MapPost("/upload", HandleUploadImage)
            .DisableAntiforgery()
            .WithName("UploadImage")
            .WithSummary("Upload an image to SeaweedFS/S3 storage")
            .WithDescription("Accepts multipart/form-data with a single image file (JPG, PNG, WEBP, GIF, max 10MB).")
            .WithTags(StorageTag)
            .Produces<UploadImageResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);
    }


    private async Task<IResult> HandleUploadImage(
            [FromForm] IFormFile file,
            ISender sender,
            CancellationToken ct)
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

        await using var stream = file.OpenReadStream();
        var command = new UploadImageCommand(
            stream,
            file.FileName,
            file.ContentType,
            file.Length);

        var result = await sender.Send(command, ct);

        return result.IsSuccess
            ? Results.Ok(result.Value)
            : result.ToProblemDetails();
    }
}
