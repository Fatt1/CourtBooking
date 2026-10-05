using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Features.V1.Branches.Queries.GetPublicBranchById;
using CourtBooking.Application.Features.V1.Branches.Queries.SearchPublicBranches;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Branches;

public sealed class PublicBranchEndpoints : IEndpointGroup
{
    private const string BranchTag = "Branches";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("branches")
            .AllowAnonymous()
            .WithTags(BranchTag);

        // 1. Tìm kiếm chi nhánh công khai
        group.MapGet("/", async (
            [FromQuery] string? search,
            [FromQuery] string? province,
            [FromQuery] string? district,
            [FromQuery] Guid? sportTypeId,
            [FromQuery] string? courtType,
            [FromQuery] DateOnly? date,
            [FromQuery] TimeOnly? startTime,
            [FromQuery] double? minRating,
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
                sportTypeId,
                courtType,
                date,
                startTime,
                minRating,
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
        .WithDescription("Khách hàng tìm kiếm, lọc chi nhánh theo khu vực, môn thể thao, loại sân, đánh giá, khoảng cách hoặc theo khung giờ còn sân trống.")
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
}
