using CourtBooking.API.Extensions;
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
    private const string OwnerTag = "Owner Authentication (Chủ Sân)";
    private const string PlayerTag = "Player Authentication (Người Chơi)";

    public void Map(IEndpointRouteBuilder app)
    {
        // ── 1. Cụm endpoint dành riêng cho Chủ sân (Owner) ─────────────
        var ownerGroup = app.MapApiV1Group("owner/auth");
        MapOwnerEndpoints(ownerGroup);

        // ── 2. Cụm endpoint dành cho Người chơi (Player) ───────────────
        var playerGroup = app.MapApiV1Group("player/auth");
        MapPlayerEndpoints(playerGroup);

        // ── 3. Cụm endpoint tương thích ngược (identities) ────────────
        var genericGroup = app.MapApiV1Group("identities");
        MapGenericEndpoints(genericGroup);
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
            .WithTags(OwnerTag)
            .Produces<AuthResponse>(StatusCodes.Status200OK)
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
            .WithTags(OwnerTag)
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
            .WithTags(OwnerTag)
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
            .WithTags(OwnerTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }

    /// <summary>
    /// Các API xác thực dành cho Người chơi (Player)
    /// </summary>
    private static void MapPlayerEndpoints(RouteGroupBuilder group)
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
                request.PhoneNumber);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("PlayerRegister")
            .WithSummary("Đăng ký tài khoản Người chơi")
            .WithDescription("Tạo tài khoản người chơi mới, tự động gán role Player và tạo hồ sơ người chơi.")
            .WithTags(PlayerTag)
            .Produces<AuthResponse>(StatusCodes.Status200OK)
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
            .WithTags(PlayerTag)
            .Produces<AuthResponse>(StatusCodes.Status200OK)
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
            .WithTags(PlayerTag)
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
            .WithTags(PlayerTag)
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
            .WithTags(PlayerTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 6. POST /api/v1/player/auth/refresh-token — Làm mới token
        group.MapPost("/refresh-token", async (
                [FromBody] RefreshTokenRequest? request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new RefreshTokenCommand(request?.RefreshToken);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("PlayerRefreshToken")
            .WithSummary("Làm mới Access Token")
            .WithDescription("Sử dụng Refresh Token từ Request Body hoặc HttpOnly Cookie để cấp Access Token mới.")
            .WithTags(PlayerTag)
            .Produces<AuthResponse>(StatusCodes.Status200OK)
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
            .WithTags(PlayerTag)
            .Produces<CurrentUserDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    /// <summary>
    /// Các API tương thích ngược với route /api/v1/identities
    /// </summary>
    private static void MapGenericEndpoints(RouteGroupBuilder group)
    {
        group.MapPost("/login", async (
                [FromBody] LoginRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new LoginCommand(request.Email, request.Password);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("GenericLogin")
            .WithSummary("Đăng nhập hệ thống (chung)")
            .WithTags("Identities (Chung)")
            .Produces<AuthResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapPost("/register", async (
                [FromBody] RegisterPlayerRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new RegisterPlayerCommand(request.Email, request.Password, request.FullName, request.PhoneNumber);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("GenericRegister")
            .WithTags("Identities (Chung)");

        group.MapPost("/refresh-token", async (
                [FromBody] RefreshTokenRequest? request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new RefreshTokenCommand(request?.RefreshToken);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("GenericRefreshToken")
            .WithTags("Identities (Chung)");

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
            .WithName("GenericMe")
            .WithTags("Identities (Chung)");
    }
}
