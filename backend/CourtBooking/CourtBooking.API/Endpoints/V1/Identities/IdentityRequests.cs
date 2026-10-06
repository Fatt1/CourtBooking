using CourtBooking.Domain.Enums;

namespace CourtBooking.API.Endpoints.V1.Identities;

public sealed record RegisterPlayerRequest(
    string Email,
    string Password,
    string FullName,
    Gender Gender,
    string PhoneNumber);

public sealed record LoginRequest(
    string Email,
    string Password);

public sealed record RefreshTokenRequest(
    string? RefreshToken = null);

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);

public sealed record ForgotPasswordRequest(
    string Email,
    string? ClientResetUrl = null);

public sealed record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword);
