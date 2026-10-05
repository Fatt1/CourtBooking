using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Courts.Commands.CreateCourt;
using CourtBooking.Application.Features.V1.Courts.Commands.DeleteCourt;
using CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourt;
using CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourtStatus;
using CourtBooking.Application.Features.V1.Courts.Dtos;
using CourtBooking.Application.Features.V1.Courts.Queries.GetCourtById;
using CourtBooking.Application.Features.V1.Courts.Queries.GetCourtsByBranch;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Courts;

public sealed class CourtEndpoints : IEndpointGroup
{
    private const string CourtTag = "Owner Courts";

    public void Map(IEndpointRouteBuilder app)
    {
        // 1. Danh sách sân theo chi nhánh
        var branchGroup = app
            .MapApiV1Group("owner/branches/{branchId:guid}/courts")
            .RequireAuthorization(policy => policy.RequireRole("CourtOwner"));

        branchGroup.MapGet("/", async (
            Guid branchId,
            [FromQuery] Guid? courtTypeId,
            [FromQuery] CourtStatus? status,
            [FromQuery] string? search,
            ISender sender,
            CancellationToken ct) =>
        {
            var query = new GetCourtsByBranchQuery(branchId, courtTypeId, status, search);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .WithName("GetCourtsByBranch")
        .WithSummary("Lấy danh sách sân theo chi nhánh")
        .WithDescription("Lấy danh sách sân thuộc chi nhánh của chủ sân, có thể lọc theo loại sân, trạng thái và từ khóa tìm kiếm.")
        .WithTags(CourtTag)
        .Produces<IReadOnlyList<CourtDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);

        // 2. Thêm sân mới vào loại sân
        var courtTypeGroup = app
            .MapApiV1Group("owner/court-types/{courtTypeId:guid}/courts")
            .RequireAuthorization(policy => policy.RequireRole("CourtOwner"));

        courtTypeGroup.MapPost("/", async (
            Guid courtTypeId,
            [FromBody] CreateCourtRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new CreateCourtCommand(courtTypeId, request.Name);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/owner/courts/{result.Value}", result.Value)
                : result.ToProblemDetails();
        })
        .WithName("CreateCourt")
        .WithSummary("Tạo sân mới")
        .WithDescription("Thêm một sân cụ thể vào loại sân thuộc chi nhánh của chủ sân.")
        .WithTags(CourtTag)
        .Produces<Guid>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // 3. Xem, sửa, đổi trạng thái và xóa từng sân
        var courtGroup = app
            .MapApiV1Group("owner/courts/{id:guid}")
            .RequireAuthorization(policy => policy.RequireRole("CourtOwner"));

        // GET /api/v1/owner/courts/{id}
        courtGroup.MapGet("/", async (
            Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var query = new GetCourtByIdQuery(id);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .WithName("GetCourtById")
        .WithSummary("Lấy chi tiết một sân")
        .WithDescription("Lấy thông tin chi tiết một sân cụ thể thuộc chi nhánh của chủ sân.")
        .WithTags(CourtTag)
        .Produces<CourtDetailDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

        // PUT /api/v1/owner/courts/{id}
        courtGroup.MapPut("/", async (
            Guid id,
            [FromBody] UpdateCourtRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new UpdateCourtCommand(id, request.CourtTypeId, request.Name);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("UpdateCourt")
        .WithSummary("Cập nhật thông tin sân")
        .WithDescription("Cập nhật tên sân hoặc chuyển sân sang loại sân khác trong cùng chi nhánh.")
        .WithTags(CourtTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // PUT /api/v1/owner/courts/{id}/status
        courtGroup.MapPut("/status", async (
            Guid id,
            [FromBody] UpdateCourtStatusRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new UpdateCourtStatusCommand(id, request.Status);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("UpdateCourtStatus")
        .WithSummary("Đổi trạng thái sân")
        .WithDescription("Cập nhật trạng thái sân thành Hoạt động (1) hoặc Bảo trì (2).")
        .WithTags(CourtTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

        // DELETE /api/v1/owner/courts/{id}
        courtGroup.MapDelete("/", async (
            Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new DeleteCourtCommand(id);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("DeleteCourt")
        .WithSummary("Xóa sân")
        .WithDescription("Xóa một sân nếu sân chưa từng phát sinh đơn đặt hoặc lịch cấu hình.")
        .WithTags(CourtTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}