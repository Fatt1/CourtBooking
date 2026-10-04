using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Identities.Dtos;

/// <summary>
/// DTO phản hồi sau khi Đăng nhập thành công.
/// </summary>
public sealed record LoginResponse(
    Guid UserId,
    string Email,
    string FullName,
    string AccessToken,
    bool MustChangePassword = false);

/// <summary>
/// DTO phản hồi sau khi làm mới Access Token thành công.
/// </summary>
public sealed record RefreshTokenResponse(
    string AccessToken);



/// <summary>
/// DTO trả về thông tin chi tiết của người dùng đang đăng nhập.
/// </summary>
public sealed record CurrentPlayerDto(
    Guid UserId,
    string Email,
    string FullName,
    string PhoneNumber,
    Guid? ImageId,
    string? ImageKey,
    Gender Gender,
    DateOnly? DateOfBirth);
