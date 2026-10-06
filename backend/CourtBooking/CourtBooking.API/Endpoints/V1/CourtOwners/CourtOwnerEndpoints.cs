using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.CourtOwners.Commands.ChangeCourtOwnerPackage;
using CourtBooking.Application.Features.V1.CourtOwners.Commands.CreateCourtOwner;
using CourtBooking.Application.Features.V1.CourtOwners.Commands.ExtendCourtOwnerSubscription;
using CourtBooking.Application.Features.V1.CourtOwners.Commands.UpdateCourtOwnerStatus;
using CourtBooking.Application.Features.V1.CourtOwners.Dtos;
using CourtBooking.Application.Features.V1.CourtOwners.Queries.GetCourtOwners;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.CourtOwners;

public sealed class CourtOwnerEndpoints : IEndpointGroup
{
    private const string AdminCourtOwnersTag = "Admin Court Owners";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("admin/court-owners")
            .WithTags(AdminCourtOwnersTag)
            .RequireAuthorization(policy => policy.RequireRole(RoleConstants.Admin));

        // 1. GET /api/v1/admin/court-owners — Danh sách chủ sân (Tìm kiếm Tên/Email/SĐT, Lọc trạng thái)
        group.MapGet("/", async (
                [FromQuery] string? search,
                [FromQuery] UserStatus? status,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetCourtOwnersQuery(search, status, page, pageSize);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("AdminGetCourtOwners")
            .WithSummary("Tra cứu danh sách Chủ sân trong hệ thống")
            .WithDescription("Hỗ trợ tìm kiếm từ khóa theo Họ và tên, Email hoặc Số điện thoại; lọc theo Trạng thái (Hoạt động / Đã khóa).")
            .Produces<PagedList<CourtOwnerSummaryDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 2. POST /api/v1/admin/court-owners — Tạo tài khoản Chủ sân mới (PNG 1)
        group.MapPost("/", async (
                [FromBody] CreateCourtOwnerRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new CreateCourtOwnerCommand(
                request.FullName,
                request.PhoneNumber,
                request.Email,
                request.MustChangePwd,
                request.Password,
                request.BusinessName);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/admin/court-owners/{result.Value}", new { id = result.Value, message = "Khởi tạo tài khoản Chủ sân thành công." })
                : result.ToProblemDetails();
        })
            .WithName("AdminCreateCourtOwner")
            .WithSummary("Tạo tài khoản Chủ sân mới (PNG 1)")
            .WithDescription("Khởi tạo tài khoản đối tác Chủ sân mới, bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.")
            .Produces(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // 3. PUT /api/v1/admin/court-owners/{id:guid}/package — Đổi gói dịch vụ của Chủ sân (PNG 2)
        group.MapPut("/{id:guid}/package", async (
                [FromRoute] Guid id,
                [FromBody] ChangeCourtOwnerPackageRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ChangeCourtOwnerPackageCommand(id, request.NewPackageId);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("AdminChangeCourtOwnerPackage")
            .WithSummary("Đổi gói dịch vụ của Chủ sân (PNG 2)")
            .WithDescription("Gói hiện tại sẽ được thay bằng gói mới. Ngày hết hạn hiện tại (EndDate) được giữ nguyên.")
            .Produces<CourtOwnerSubscriptionDetailDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 4. POST /api/v1/admin/court-owners/{id:guid}/extend — Gia hạn gói dịch vụ của Chủ sân (PNG 3)
        group.MapPost("/{id:guid}/extend", async (
                [FromRoute] Guid id,
                [FromBody] ExtendCourtOwnerSubscriptionRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ExtendCourtOwnerSubscriptionCommand(id, request.DurationMonths);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("AdminExtendCourtOwnerSubscription")
            .WithSummary("Gia hạn gói dịch vụ của Chủ sân (PNG 3)")
            .WithDescription("Gia hạn gói dịch vụ 1, 3, 6 hoặc 12 tháng. Gia hạn nối tiếp từ ngày hết hạn hoặc từ hôm nay nếu gói đã hết hạn.")
            .Produces<CourtOwnerSubscriptionDetailDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 5. PATCH /api/v1/admin/court-owners/{id:guid}/status — Khóa / Mở khóa tài khoản Chủ sân
        group.MapPatch("/{id:guid}/status", async (
                [FromRoute] Guid id,
                [FromBody] UpdateCourtOwnerStatusRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new UpdateCourtOwnerStatusCommand(id, request.Status);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = $"Cập nhật trạng thái chủ sân thành '{request.Status}' thành công." })
                : result.ToProblemDetails();
        })
            .WithName("AdminUpdateCourtOwnerStatus")
            .WithSummary("Khóa hoặc mở khóa tài khoản Chủ sân")
            .WithDescription("Thay đổi trạng thái tài khoản giữa Active và Inactive. Nếu khóa tài khoản, các phiên đăng nhập (Refresh Token) sẽ bị thu hồi ngay lập tức.")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
