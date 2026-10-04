using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ResetPassword;

/// <summary>
/// Command đặt lại mật khẩu mới thông qua Token xác nhận từ email.
/// </summary>
public sealed record ResetPasswordCommand(
    string Email,
    string Token,
    string NewPassword) : ICommand;
