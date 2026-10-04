using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.RegisterPlayer;

/// <summary>
/// Command đăng ký tài khoản cho Người chơi (Player).
/// </summary>
public sealed record RegisterPlayerCommand(
    string Email,
    string Password,
    string FullName,
    string? PhoneNumber) : ICommand<AuthResponse>;
