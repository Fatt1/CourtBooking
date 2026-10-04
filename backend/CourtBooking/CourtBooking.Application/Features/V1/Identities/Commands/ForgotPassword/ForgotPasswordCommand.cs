using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ForgotPassword;

/// <summary>
/// Command yêu cầu đặt lại mật khẩu khi quên.
/// Hệ thống sẽ sinh token và gửi đường dẫn xác nhận qua email.
/// </summary>
public sealed record ForgotPasswordCommand(
    string Email,
    string? ClientResetUrl = null) : ICommand;
