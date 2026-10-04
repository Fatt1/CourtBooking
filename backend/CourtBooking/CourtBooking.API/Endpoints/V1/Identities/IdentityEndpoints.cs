using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Identities.Commands.ChangePassword;
using CourtBooking.Application.Features.V1.Identities.Commands.ForgotPassword;
using CourtBooking.Application.Features.V1.Identities.Commands.Login;
using CourtBooking.Application.Features.V1.Identities.Commands.RefreshToken;
using CourtBooking.Application.Features.V1.Identities.Commands.RegisterPlayer;
using CourtBooking.Application.Features.V1.Identities.Commands.ResetPassword;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Features.V1.Identities.Queries.GetCurrentUser;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Identities;

public sealed class IdentityEndpoints : IEndpointGroup
{
    private const string IdentityTag = "Identities";

    public void Map(IEndpointRouteBuilder app)
    {
        // Nhóm route gốc: /api/v1/identities
        var group = app.MapApiV1Group("identities");

        // 1. POST /api/v1/identities/register — Đăng ký tài khoản người chơi
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
            .WithName("RegisterPlayer")
            .WithSummary("Đăng ký tài khoản Người chơi")
            .WithDescription("Tạo tài khoản người chơi mới, tự động gán role Player và tạo hồ sơ người chơi.")
            .WithTags(IdentityTag)
            .Produces<AuthResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // 2. POST /api/v1/identities/login — Đăng nhập hệ thống
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
            .WithName("Login")
            .WithSummary("Đăng nhập hệ thống")
            .WithDescription("Đăng nhập bằng Email và Password, trả về Access Token và lưu Refresh Token vào HttpOnly Cookie. Hỗ trợ cảnh báo cờ MustChangePassword cho Chủ sân.")
            .WithTags(IdentityTag)
            .Produces<AuthResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 3. POST /api/v1/identities/refresh-token — Làm mới token
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
            .WithName("RefreshToken")
            .WithSummary("Làm mới Access Token")
            .WithDescription("Sử dụng Refresh Token từ Request Body hoặc HttpOnly Cookie để cấp Access Token mới và rotate Refresh Token.")
            .WithTags(IdentityTag)
            .Produces<AuthResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 4. POST /api/v1/identities/change-password — Đổi mật khẩu
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
            .WithName("ChangePassword")
            .WithSummary("Đổi mật khẩu tài khoản")
            .WithDescription("Yêu cầu đăng nhập. Tự động tắt cờ bắt buộc đổi mật khẩu (MustChangePwd = 0) nếu là tài khoản Chủ sân.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 5. POST /api/v1/identities/forgot-password — Quên mật khẩu & gửi link xác nhận qua email
        group.MapPost("/forgot-password", async (
                [FromBody] ForgotPasswordRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ForgotPasswordCommand(request.Email, request.ClientResetUrl);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Nếu email hợp lệ, đường dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn." })
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("ForgotPassword")
            .WithSummary("Quên mật khẩu — Gửi link xác nhận qua email")
            .WithDescription("Nhận Email, sinh Password Reset Token chuẩn bảo mật và gửi đường link đặt lại mật khẩu về hộp thư người dùng.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // 6. POST /api/v1/identities/reset-password — Đặt lại mật khẩu từ token/link email
        group.MapPost("/reset-password", async (
                [FromBody] ResetPasswordRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new ResetPasswordCommand(request.Email, request.Token, request.NewPassword);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(new { message = "Đặt lại mật khẩu thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập." })
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("ResetPassword")
            .WithSummary("Đặt lại mật khẩu mới qua Token")
            .WithDescription("Nhận Email, Token từ đường link email và Mật khẩu mới để đặt lại mật khẩu. Tự động thu hồi các phiên đăng nhập cũ.")
            .WithTags(IdentityTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // 7. GET /api/v1/identities/me — Lấy thông tin user hiện tại
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
            .WithName("GetCurrentUser")
            .WithSummary("Lấy thông tin người dùng đang đăng nhập")
            .WithDescription("Trả về thông tin chi tiết của tài khoản hiện tại từ Access Token.")
            .WithTags(IdentityTag)
            .Produces<CurrentUserDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
