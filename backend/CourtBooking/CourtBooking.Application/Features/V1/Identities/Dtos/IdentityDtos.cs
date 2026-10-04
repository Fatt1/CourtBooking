namespace CourtBooking.Application.Features.V1.Identities.Dtos;

/// <summary>
/// DTO phản hồi sau khi Đăng nhập / Đăng ký / Refresh token thành công.
/// </summary>
public sealed record AuthResponse(
    Guid UserId,
    string Email,
    string FullName,
    string Role,
    string AccessToken,
    bool MustChangePassword = false);

/// <summary>
/// DTO trả về thông tin chi tiết của người dùng đang đăng nhập.
/// </summary>
public sealed record CurrentUserDto(
    Guid UserId,
    string Email,
    string FullName,
    string? PhoneNumber,
    string Role,
    string AccountType,
    string? BusinessName = null,
    bool? MustChangePassword = null);
