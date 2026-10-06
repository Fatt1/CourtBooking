using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.RefreshToken;

/// <summary>
/// Command làm mới Access Token từ Refresh Token.
/// </summary>
public sealed record RefreshTokenCommand() : ICommand<string>;
