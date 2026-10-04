using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Identities.Commands.RegisterPlayer;

/// <summary>
/// Command đăng ký tài khoản cho Người chơi (Player).
/// </summary>
public sealed record RegisterPlayerCommand(
    string Email,
    string Password,
    string FullName,
    Gender Gender,
    string PhoneNumber) : ICommand;
