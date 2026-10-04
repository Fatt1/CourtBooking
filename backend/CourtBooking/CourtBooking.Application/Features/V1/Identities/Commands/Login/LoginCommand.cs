using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.Login;

/// <summary>
/// Command đăng nhập hệ thống bằng Email và Mật khẩu.
/// </summary>
public sealed record LoginCommand(
    string Email,
    string Password) : ICommand<AuthResponse>;
