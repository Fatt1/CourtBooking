using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ResetPassword;

/// <summary>
/// Command đặt lại mật khẩu mới thông qua Token xác nhận từ Email.
/// </summary>
public sealed record ResetPasswordCommand(
    string Email,
    string Token,
    string NewPassword,
    AccountType? ExpectedAccountType = null) : ICommand;
