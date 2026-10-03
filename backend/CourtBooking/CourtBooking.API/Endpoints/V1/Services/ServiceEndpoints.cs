using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Services.Commands.CreateService;
using CourtBooking.Application.Features.V1.Services.Commands.DeleteService;
using CourtBooking.Application.Features.V1.Services.Commands.UpdateService;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Features.V1.Services.Queries.GetOwnerServices;
using CourtBooking.Application.Features.V1.Services.Queries.GetServiceById;
using CourtBooking.Application.Features.V1.Services.Queries.GetServicesByBranch;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Services;

public sealed class ServiceEndpoints : IEndpointGroup
{
    private const string ServiceTag = "Services";

    public void Map(IEndpointRouteBuilder app)
    {
        var groupOwner = app.MapApiV1Group("owner/services");
        // .RequireAuthorization(policy => policy.RequireRole("CourtOwner"));
        MapToOwner(groupOwner);

        var group = app.MapApiV1Group("services");
        MapToPublic(group);
    }


    private static void MapToPublic(RouteGroupBuilder group)
    {
        // GET /api/v1/services — Danh sách dịch vụ công khai (có phân trang & lọc)
        group.MapGet("/{branchId:guid}", async (
                Guid branchId,
                [FromQuery] string? search,
                [FromQuery] Guid? categoryId,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetServicesByBranchQuery(branchId, search, categoryId, true);
            var result = await sender.Send(query, ct);
            return result.IsSuccess
                ? TypedResults.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetPublicServices")
            .WithSummary("Lấy danh sách dịch vụ công khai ")
            .WithTags(ServiceTag)
            .Produces<List<ServiceByBranchDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);
    }


    // Các endpoint dành cho chủ sở hữu chi nhánh
    private static void MapToOwner(RouteGroupBuilder group)
    {
        // GET /api/v1/owner/services — Danh sách toàn bộ dịch vụ của chủ sân kèm danh sách chi nhánh
        group.MapGet("/", async (
                [FromQuery] string? search,
                [FromQuery] Guid? categoryId,
                [FromQuery] Guid? branchId,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetOwnerServicesQuery(search, categoryId, branchId, page, pageSize);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? TypedResults.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetOwnerServices")
            .WithSummary("Lấy danh sách tất cả dịch vụ của chủ sân kèm danh sách chi nhánh")
            .WithDescription("Trả về danh sách dịch vụ của chủ sân, mỗi dịch vụ kèm theo danh sách các chi nhánh đang áp dụng, giá và trạng thái.")
            .WithTags(ServiceTag)
            .Produces<PagedList<OwnerServiceDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);



        // GET /api/v1/owner/services/{id:guid} — Xem chi tiết dịch vụ
        group.MapGet("/{id:guid}", async (
                Guid id,
                ISender sender,
                CancellationToken ct) =>
        {
            var query = new GetServiceByIdQuery(id);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? TypedResults.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetServiceById")
            .WithSummary("Lấy thông tin chi tiết dịch vụ kèm danh sách chi nhánh")
            .WithDescription("Trả về thông tin chi tiết của dịch vụ bao gồm danh mục, hình ảnh, đơn vị tính và danh sách các chi nhánh đang áp dụng giá/trạng thái.")
            .WithTags(ServiceTag)
            .Produces<OwnerServiceDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // POST /api/v1/owner/services — Tạo mới dịch vụ kèm giá theo các chi nhánh
        group.MapPost("/", async (
                CreateServiceRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new CreateServiceCommand(
                request.CategoryId,
                request.Name,
                request.Unit,
                request.ImageId,
                request.Branches);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? TypedResults.Created($"/api/v1/owner/services/{result.Value}", result.Value)
                : result.ToProblemDetails();
        })
            .WithName("CreateService")
            .WithSummary("Tạo mới dịch vụ và gán giá cho các chi nhánh")
            .WithDescription("Nếu có truyền ImageId, hệ thống sẽ tự động kích hoạt event AttachImages để chuyển trạng thái ảnh.")
            .WithTags(ServiceTag)
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // PUT /api/v1/owner/services/{id:guid} — Cập nhật dịch vụ
        group.MapPut("/{id:guid}", async (
                Guid id,
                UpdateServiceRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new UpdateServiceCommand(
                id,
                request.CategoryId,
                request.Name,
                request.Unit,
                request.ImageId,
                request.Branches);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? TypedResults.NoContent()
                : result.ToProblemDetails();
        })
            .WithName("UpdateService")
            .WithSummary("Cập nhật thông tin dịch vụ, hình ảnh và danh sách chi nhánh áp dụng")
            .WithDescription("Hệ thống tự động so khớp danh sách chi nhánh để thêm mới hoặc gỡ bỏ. Nếu gỡ bỏ chi nhánh đã có đơn hàng sẽ báo lỗi 409 Conflict. Nếu ảnh thay đổi, hệ thống sẽ kích hoạt sự kiện ảnh tương ứng.")
            .WithTags(ServiceTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // DELETE /api/v1/owner/services/{id:guid} — Xóa dịch vụ
        group.MapDelete("/{id:guid}", async (
                Guid id,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new DeleteServiceCommand(id);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? TypedResults.NoContent()
                : result.ToProblemDetails();
        })
            .WithName("DeleteService")
            .WithSummary("Xóa dịch vụ")
            .WithDescription("Kiểm tra nếu đã phát sinh OrderService hoặc RetailOrder thì không cho phép xóa (báo lỗi 409 Conflict), chưa phát sinh thì xóa thành công.")
            .WithTags(ServiceTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
