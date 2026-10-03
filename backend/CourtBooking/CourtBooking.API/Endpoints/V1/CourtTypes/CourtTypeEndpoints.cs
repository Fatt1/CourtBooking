using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.CourtTypes.Commands.CreateCourtType;
using CourtBooking.Application.Features.V1.CourtTypes.Commands.DeleteCourtType;
using CourtBooking.Application.Features.V1.CourtTypes.Commands.UpdateCourtType;
using CourtBooking.Application.Features.V1.CourtTypes.Dtos;
using CourtBooking.Application.Features.V1.CourtTypes.Queries.GetCourtTypesByBranch;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace CourtBooking.API.Endpoints.V1.CourtTypes;

public sealed class CourtTypeEndpoints : IEndpointGroup
{
    private const string CourtTypeTag = "Owner Court Types";

    public void Map(IEndpointRouteBuilder app)
    {
        // ── 1. Thao tác theo chi nhánh (Danh sách & Thêm mới) ───────
        var branchGroup = app.MapApiV1Group("owner/branches/{branchId:guid}/court-types");
            // .RequireAuthorization(policy => policy.RequireRole("CourtOwner"));

        // GET /api/v1/owner/branches/{branchId}/court-types
        branchGroup.MapGet("/", async (
            Guid branchId,
            ISender sender,
            CancellationToken ct) =>
        {
            var query = new GetCourtTypesByBranchQuery(branchId);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .WithName("GetCourtTypesByBranch")
        .WithSummary("Lấy danh sách loại sân theo chi nhánh")
        .WithDescription("Trả về danh sách tất cả các loại sân thuộc chi nhánh của chủ sân.")
        .WithTags(CourtTypeTag)
        .Produces<IReadOnlyList<CourtTypeDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);

        // POST /api/v1/owner/branches/{branchId}/court-types
        branchGroup.MapPost("/", async (
            Guid branchId,
            CreateCourtTypeRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new CreateCourtTypeCommand(
                branchId,
                request.Name,
                request.MinutesConfig);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Created(
                    $"/api/v1/owner/court-types/{result.Value}",
                    result.Value)
                : result.ToProblemDetails();
        })
        .WithName("CreateCourtType")
        .WithSummary("Tạo mới loại sân cho chi nhánh")
        .WithDescription("Tạo một loại sân mới trong chi nhánh. Kiểm tra không trùng tên loại sân trong cùng chi nhánh.")
        .WithTags(CourtTypeTag)
        .Produces<Guid>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // ── 2. Thao tác theo loại sân cụ thể (Sửa & Xóa) ────────────
        var itemGroup = app.MapApiV1Group("owner/court-types");
            // .RequireAuthorization(policy => policy.RequireRole("CourtOwner"));

        // PUT /api/v1/owner/court-types/{id}
        itemGroup.MapPut("/{id:guid}", async (
            Guid id,
            UpdateCourtTypeRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new UpdateCourtTypeCommand(
                id,
                request.Name,
                request.MinutesConfig);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("UpdateCourtType")
        .WithSummary("Cập nhật thông tin loại sân")
        .WithDescription("Cập nhật tên và thời lượng cấu hình slot của loại sân. Tự động kiểm tra quyền sở hữu chi nhánh và không trùng tên loại sân khác.")
        .WithTags(CourtTypeTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // DELETE /api/v1/owner/court-types/{id}
        itemGroup.MapDelete("/{id:guid}", async (
            Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new DeleteCourtTypeCommand(id);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("DeleteCourtType")
        .WithSummary("Xóa loại sân")
        .WithDescription("Chỉ cho phép xóa khi loại sân chưa có sân con trực thuộc, chưa có bảng giá và chưa có khung giờ cố định. Tự động kiểm tra quyền sở hữu chi nhánh.")
        .WithTags(CourtTypeTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
