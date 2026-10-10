using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Users.Commands.RestoreUser;
using CourtBooking.Application.Features.V1.Users.Commands.SoftDeleteUser;
using CourtBooking.Application.Features.V1.Users.Commands.UpdateUserStatus;
using CourtBooking.Application.Features.V1.Users.Dtos;
using CourtBooking.Application.Features.V1.Users.Queries.GetUsers;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Users;

public sealed class UserEndpoints : IEndpointGroup
{
    private const string AdminUsersTag = "Admin Users";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("admin/users")
            .WithTags(AdminUsersTag)
            .RequireAuthorization(policy => policy.RequireRole(RoleConstants.Admin));

        // 1. GET /api/v1/admin/users — Lấy danh sách người dùng toàn hệ thống
        group.MapGet("/", async (
                [FromQuery] string? search,
                [FromQuery] AccountType? accountType,
                [FromQuery] UserStatus? status,
                [FromQuery] bool includeDeleted = false,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetUsersQuery(search, accountType, status, includeDeleted, page, pageSize);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("AdminGetUsers")
            .WithSummary("Tra cứu danh sách người dùng trong hệ thống")
            .WithDescription("Hỗ trợ tìm kiếm từ khóa theo Họ và tên, Email hoặc Số điện thoại, lọc theo loại tài khoản (Admin, Player), trạng thái và tùy chọn xem cả tài khoản đã xóa mềm.")
            .Produces<PagedList<UserSummaryDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 2. PATCH /api/v1/admin/users/{id:guid}/status — Khóa / Mở khóa tài khoản người dùng
        group.MapPatch("/{id:guid}/status", async (
                [FromRoute] Guid id,
                [FromBody] UpdateUserStatusRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new UpdateUserStatusCommand(id, request.Status);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = $"Cập nhật trạng thái người dùng thành '{request.Status}' thành công." })
                : result.ToProblemDetails();
        })
            .WithName("AdminUpdateUserStatus")
            .WithSummary("Khóa hoặc mở khóa tài khoản người dùng (Status)")
            .WithDescription("Thay đổi trạng thái tài khoản giữa Active và Inactive. Nếu khóa tài khoản, các phiên đăng nhập (Refresh Token) sẽ bị thu hồi. Không cho phép Admin tự khóa chính mình.")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 3. DELETE /api/v1/admin/users/{id:guid} — Đánh dấu xóa mềm người dùng
        group.MapDelete("/{id:guid}", async (
                [FromRoute] Guid id,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new SoftDeleteUserCommand(id);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Đã đánh dấu xóa mềm tài khoản người dùng thành công." })
                : result.ToProblemDetails();
        })
            .WithName("AdminSoftDeleteUser")
            .WithSummary("Đánh dấu xóa mềm người dùng (IsDeleted = true)")
            .WithDescription("Chuyển cờ IsDeleted = true và tắt trạng thái hoạt động. Dữ liệu lịch sử đơn hàng/vé vẫn được bảo toàn. Không cho phép Admin tự xóa chính mình.")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 4. POST /api/v1/admin/users/{id:guid}/restore — Khôi phục tài khoản đã xóa mềm
        group.MapPost("/{id:guid}/restore", async (
                [FromRoute] Guid id,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new RestoreUserCommand(id);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Đã khôi phục tài khoản người dùng thành công." })
                : result.ToProblemDetails();
        })
            .WithName("AdminRestoreUser")
            .WithSummary("Khôi phục tài khoản đã bị xóa mềm (IsDeleted = false)")
            .WithDescription("Khôi phục cờ IsDeleted = false và chuyển trạng thái về Active.")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
