using CourtBooking.API.Extensions;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Identities.Commands.ChangePassword;
using CourtBooking.Application.Features.V1.Identities.Commands.ForgotPassword;
using CourtBooking.Application.Features.V1.Identities.Commands.Login;
using CourtBooking.Application.Features.V1.Identities.Commands.RefreshToken;
using CourtBooking.Application.Features.V1.Identities.Commands.RegisterPlayer;
using CourtBooking.Application.Features.V1.Identities.Commands.ResetPassword;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Features.V1.Identities.Queries.GetCurrentUser;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Identities;

public sealed class IdentityEndpoints : IEndpointGroup
{
    private const string IdentityTag = "Identity";

    public void Map(IEndpointRouteBuilder app)
    {
        // ── 1. Cụm endpoint dành riêng cho Chủ sân (Owner) ─────────────
        var ownerGroup = app.MapApiV1Group("owner/identity");
        MapOwnerEndpoints(ownerGroup);

        // ── 2. Cụm endpoint dành cho Người chơi (Player) ───────────────
        var group = app.MapApiV1Group("identity");
        MapToPublic(group);


    }

    /// <summary>
    /// Các API xác thực dành riêng cho Chủ sân (CourtOwner)
    /// </summary>
    private static void MapOwnerEndpoints(RouteGroupBuilder group)
    {
        // 1. POST /api/v1/owner/auth/login — Chủ sân đăng nhập
        group.MapPost("/login", async (
                [FromBody] LoginRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new LoginCommand(request.Email, request.Password, AccountType.CourtOwner);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("OwnerLogin")
            .WithSummary("Đăng nhập dành cho Chủ sân (CourtOwner)")
            .WithDescription("Chỉ cho phép tài khoản Chủ sân (CourtOwner) đăng nhập vào hệ thống quản lý sân.")
            .WithTags(IdentityTag)
            .Produces<LoginResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 2. POST /api/v1/owner/auth/forgot-password — Chủ sân quên mật khẩu
        group.MapPost("/forgot-password", async (
                [FromBody] ForgotPasswordRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ForgotPasswordCommand(request.Email, request.ClientResetUrl, AccountType.CourtOwner);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Nếu email hợp lệ và đúng tài khoản Chủ sân, đường dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn." })
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("OwnerForgotPassword")
            .WithSummary("Chủ sân quên mật khẩu — Gửi link đặt lại mật khẩu qua email")
            .WithDescription("Chỉ áp dụng cho tài khoản Chủ sân. Đường link đặt lại mật khẩu sẽ trỏ về cổng quản trị của Chủ sân.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // 3. POST /api/v1/owner/auth/reset-password — Chủ sân đặt lại mật khẩu
        group.MapPost("/reset-password", async (
                [FromBody] ResetPasswordRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ResetPasswordCommand(request.Email, request.Token, request.NewPassword, AccountType.CourtOwner);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Chủ sân đặt lại mật khẩu thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập." })
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("OwnerResetPassword")
            .WithSummary("Chủ sân đặt lại mật khẩu mới qua Token")
            .WithDescription("Nhận Email, Token từ email và Mật khẩu mới để đặt lại mật khẩu cho tài khoản Chủ sân.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // 4. POST /api/v1/owner/auth/change-password — Chủ sân đổi mật khẩu
        group.MapPost("/change-password", async (
                [FromBody] ChangePasswordRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ChangePasswordCommand(request.CurrentPassword, request.NewPassword);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Đổi mật khẩu thành công." })
                : result.ToProblemDetails();
        })
            .RequireAuthorization()
            .WithName("OwnerChangePassword")
            .WithSummary("Chủ sân đổi mật khẩu")
            .WithDescription("Yêu cầu đăng nhập. Tự động tắt cờ bắt buộc đổi mật khẩu (MustChangePwd = 0) sau lần đổi đầu tiên.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 6. POST /api/v1/owner/identity/logout — Chủ sân đăng xuất và xóa Refresh Token Cookie
        group.MapPost("/logout", (IAuthCookieService cookieService) =>
        {
            cookieService.DeleteRefreshTokenCookie();
            return Results.Ok(new { message = "Đăng xuất thành công." });
        })
            .AllowAnonymous()
            .WithName("OwnerLogout")
            .WithSummary("Chủ sân đăng xuất và xóa Refresh Token Cookie")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK);
    }

    /// <summary>
    /// Các API xác thực dành cho Người chơi (Player)
    /// </summary>
    private static void MapToPublic(RouteGroupBuilder group)
    {
        // 1. POST /api/v1/player/auth/register — Đăng ký người chơi
        group.MapPost("/register", async (
                [FromBody] RegisterPlayerRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new RegisterPlayerCommand(
                request.Email,
                request.Password,
                request.FullName,
                request.Gender,
                request.PhoneNumber);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok()
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("PlayerRegister")
            .WithSummary("Đăng ký tài khoản Người chơi")
            .WithDescription("Tạo tài khoản người chơi mới, tự động gán role Player và tạo hồ sơ người chơi.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // 2. POST /api/v1/player/auth/login — Đăng nhập người chơi
        group.MapPost("/login", async (
                [FromBody] LoginRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new LoginCommand(request.Email, request.Password, AccountType.Player);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("PlayerLogin")
            .WithSummary("Đăng nhập dành cho Người chơi")
            .WithDescription("Đăng nhập vào cổng người chơi với Email và Password.")
            .WithTags(IdentityTag)
            .Produces<LoginResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 3. POST /api/v1/player/auth/forgot-password — Người chơi quên mật khẩu
        group.MapPost("/forgot-password", async (
                [FromBody] ForgotPasswordRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ForgotPasswordCommand(request.Email, request.ClientResetUrl, AccountType.Player);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Nếu email hợp lệ và đúng tài khoản người chơi, đường dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn." })
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("PlayerForgotPassword")
            .WithSummary("Người chơi quên mật khẩu — Gửi link xác nhận qua email")
            .WithDescription("Chỉ áp dụng cho tài khoản Người chơi. Đường link đặt lại mật khẩu trỏ về cổng người chơi.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // 4. POST /api/v1/player/auth/reset-password — Người chơi đặt lại mật khẩu
        group.MapPost("/reset-password", async (
                [FromBody] ResetPasswordRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ResetPasswordCommand(request.Email, request.Token, request.NewPassword, AccountType.Player);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Đặt lại mật khẩu thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập." })
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("PlayerResetPassword")
            .WithSummary("Người chơi đặt lại mật khẩu mới qua Token")
            .WithDescription("Nhận Email, Token từ link email và Mật khẩu mới để đặt lại mật khẩu cho tài khoản Người chơi.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // 5. POST /api/v1/player/auth/change-password — Người chơi đổi mật khẩu
        group.MapPost("/change-password", async (
                [FromBody] ChangePasswordRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ChangePasswordCommand(request.CurrentPassword, request.NewPassword);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Đổi mật khẩu thành công." })
                : result.ToProblemDetails();
        })
            .RequireAuthorization()
            .WithName("PlayerChangePassword")
            .WithSummary("Người chơi đổi mật khẩu")
            .WithDescription("Yêu cầu đăng nhập tài khoản Người chơi để đổi mật khẩu.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 6. POST /api/v1/player/auth/refresh-token — Làm mới token
        group.MapPost("/refresh-token", async (
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new RefreshTokenCommand();
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new RefreshTokenResponse(result.Value))
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("RefreshToken")
            .WithSummary("Làm mới Access Token")
            .WithDescription("Sử dụng Refresh Token từ HttpOnly Cookie để cấp Access Token mới.")
            .WithTags(IdentityTag)
            .Produces<RefreshTokenResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 7. GET /api/v1/player/auth/me — Lấy thông tin user hiện tại
        group.MapGet("/me", async (
                ISender sender,
                CancellationToken ct) =>
        {
            var query = new GetCurrentUserQuery();
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .RequireAuthorization()
            .WithName("PlayerGetCurrentUser")
            .WithSummary("Lấy thông tin người dùng đang đăng nhập")
            .WithDescription("Trả về thông tin chi tiết của tài khoản hiện tại từ Access Token.")
            .WithTags(IdentityTag)
            .Produces<CurrentPlayerDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 8. POST /api/v1/identity/logout — Người chơi đăng xuất và xóa Refresh Token Cookie
        group.MapPost("/logout", (IAuthCookieService cookieService) =>
        {
            cookieService.DeleteRefreshTokenCookie();
            return Results.Ok(new { message = "Đăng xuất thành công." });
        })
            .AllowAnonymous()
            .WithName("PlayerLogout")
            .WithSummary("Người chơi đăng xuất và xóa Refresh Token Cookie")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK);
    }


}
