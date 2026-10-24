using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ForgotPassword;

/// <summary>
/// Command yêu cầu cấp link đặt lại mật khẩu gửi về Email.
/// </summary>
public sealed record ForgotPasswordCommand(
    string Email,
    AccountType? ExpectedAccountType = null) : ICommand;
