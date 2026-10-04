using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Branches.Commands.CreateBranch;
using CourtBooking.Application.Features.V1.Branches.Commands.DeleteBranch;
using CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranch;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchById;
using CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranches;
using CourtBooking.SharedKernel.Extensions;
using MediatR;

namespace CourtBooking.API.Endpoints.V1.Branches;

public sealed class BranchEndpoints : IEndpointGroup
{
    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("owner/branches")
            .RequireAuthorization(policy => policy.RequireRole("CourtOwner"))
            .WithTags("Owner Branches");

        group.MapGet("/", async (ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetOwnerBranchesQuery(), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemDetails();
        })
        .WithName("GetOwnerBranches")
        .WithSummary("Lấy danh sách chi nhánh của chủ sân")
        .Produces<IReadOnlyList<OwnerBranchListItemDto>>()
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);

        group.MapGet("/{id:guid}", async (Guid id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetOwnerBranchByIdQuery(id), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemDetails();
        })
        .WithName("GetOwnerBranchById")
        .WithSummary("Xem chi tiết chi nhánh của chủ sân")
        .Produces<OwnerBranchDetailDto>()
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateBranchRequest body, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new CreateBranchCommand(
                body.Name, body.Hotline, body.Province, body.District, body.Street,
                body.GgMapUrl, body.OpenTime, body.CloseTime, body.QrImageId,
                body.AccountNumber, body.AccountName, body.SportTypeIds,
                body.Policy, body.Latitude, body.Longitude, body.ImageIds), ct);
            return result.IsSuccess
                ? Results.Created($"/api/v1/owner/branches/{result.Value}", result.Value)
                : result.ToProblemDetails();
        })
        .WithName("CreateOwnerBranch")
        .WithSummary("Thêm chi nhánh")
        .Produces<Guid>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPut("/{id:guid}", async (Guid id, UpdateBranchRequest body, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new UpdateBranchCommand(
                id, body.Name, body.Hotline, body.Province, body.District, body.Street,
                body.GgMapUrl, body.OpenTime, body.CloseTime, body.QrImageId,
                body.AccountNumber, body.AccountName, body.SportTypeIds,
                body.Policy, body.Latitude, body.Longitude, body.ImageIds), ct);
            return result.IsSuccess ? Results.NoContent() : result.ToProblemDetails();
        })
        .WithName("UpdateOwnerBranch")
        .WithSummary("Cập nhật chi nhánh")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", async (Guid id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new DeleteBranchCommand(id), ct);
            return result.IsSuccess ? Results.NoContent() : result.ToProblemDetails();
        })
        .WithName("DeleteOwnerBranch")
        .WithSummary("Xóa chi nhánh chưa có dữ liệu liên quan")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
