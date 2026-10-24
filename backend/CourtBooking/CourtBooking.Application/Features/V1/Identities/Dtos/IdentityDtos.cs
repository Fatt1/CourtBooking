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
    string RoleName,
    bool MustChangePassword = false,
    string? PhoneNumber = null);

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

/// <summary>
/// DTO gói dịch vụ hiện tại của chủ sân
/// </summary>
public sealed record CurrentOwnerPackageDto(
    Guid PackageId,
    string PackageName,
    decimal Price,
    DateOnly StartDate,
    DateOnly EndDate);

/// <summary>
/// DTO hồ sơ cá nhân và thông tin kinh doanh của Chủ sân
/// </summary>
public sealed record OwnerProfileDto(
    Guid Id,
    string FullName,
    string Email,
    string PhoneNumber,
    string BusinessName,
    string? TaxCode,
    CurrentOwnerPackageDto? CurrentPackage);

/// <summary>
/// DTO yêu cầu cập nhật thông tin hồ sơ Người chơi
/// </summary>
public sealed record UpdatePlayerProfileRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    Gender Gender,
    DateOnly? DateOfBirth);
