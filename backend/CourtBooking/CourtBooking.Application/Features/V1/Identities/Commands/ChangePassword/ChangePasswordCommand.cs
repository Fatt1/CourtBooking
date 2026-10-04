using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ChangePassword;

/// <summary>
/// Command đổi mật khẩu cho người dùng đang đăng nhập.
/// </summary>
public sealed record ChangePasswordCommand(
    string CurrentPassword,
    string NewPassword) : ICommand;
