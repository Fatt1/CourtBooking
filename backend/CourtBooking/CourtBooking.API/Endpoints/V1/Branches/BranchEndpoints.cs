using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Branches.Commands.CreateBranch;
using CourtBooking.Application.Features.V1.Branches.Commands.DeleteBranch;
using CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranch;
using CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranchStatus;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchById;
using CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranches;
using CourtBooking.Application.Features.V1.Branches.Queries.GetPublicBranchById;
using CourtBooking.Application.Features.V1.Branches.Queries.SearchPublicBranches;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Branches;

public sealed class BranchEndpoints : IEndpointGroup
{
    private const string BranchTag = "Branches";
    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("owner/branches")
            .RequireAuthorization(policy => policy.RequireRole("CourtOwner"))
            .WithTags(BranchTag);

        MapToOwner(group);


        var publicGroup = app.MapApiV1Group("branches")
          .WithTags(BranchTag);

        MapToPublic(publicGroup);

    }


    public void MapToPublic(RouteGroupBuilder group)
    {
        // 1. Tìm kiếm chi nhánh công khai
        group.MapGet("/", async (
            [FromQuery] string? search,
            [FromQuery] string? province,
            [FromQuery] string? district,
            [FromQuery] Guid[]? sportTypeIds,
            [FromQuery] DateOnly? date,
            [FromQuery] TimeOnly? startTime,
            [FromQuery] TimeOnly? endTime,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] double? rating,
            [FromQuery] string? sort,
            [FromQuery] decimal? latitude,
            [FromQuery] decimal? longitude,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            ISender sender = null!,
            CancellationToken ct = default) =>
        {
            var query = new SearchPublicBranchesQuery(
                search,
                province,
                district,
                sportTypeIds,
                date,
                startTime,
                endTime,
                minPrice,
                maxPrice,
                rating,
                sort,
                latitude,
                longitude,
                page,
                pageSize);

            var result = await sender.Send(query, ct);
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemDetails();
        })
        .WithName("SearchPublicBranches")
        .WithSummary("Tìm kiếm chi nhánh và sân công khai")
        .WithDescription("Khách hàng tìm kiếm, lọc chi nhánh theo khu vực, môn thể thao, đánh giá, khoảng cách hoặc theo khung giờ còn sân trống.")
        .Produces<PagedList<PublicBranchListItemDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);

        // 2. Xem chi tiết chi nhánh công khai
        group.MapGet("/{id:guid}", async (
            Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new GetPublicBranchByIdQuery(id), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemDetails();
        })
        .WithName("GetPublicBranchById")
        .WithSummary("Xem chi tiết chi nhánh công khai")
        .WithDescription("Khách hàng xem thông tin chi tiết của một chi nhánh bao gồm danh sách môn thể thao, loại sân, dịch vụ và hình ảnh.")
        .Produces<PublicBranchDetailDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);

    }

    public void MapToOwner(RouteGroupBuilder group)
    {
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

        group.MapPut("/{id:guid}/status", async (Guid id, UpdateBranchStatusRequest body, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new UpdateBranchStatusCommand(id, body.IsActive), ct);
            return result.IsSuccess ? Results.NoContent() : result.ToProblemDetails();
        })
        .WithName("UpdateOwnerBranchStatus")
        .WithSummary("Bật hoặc tắt trạng thái hoạt động của chi nhánh")
        .WithDescription("Chủ sân bật hoặc tắt chi nhánh. Chi nhánh bị tắt không nhận đơn đặt sân mới nhưng không hủy các đơn đã tồn tại.")
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

