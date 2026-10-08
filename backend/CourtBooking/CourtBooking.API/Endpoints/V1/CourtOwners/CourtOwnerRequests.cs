using CourtBooking.Domain.Enums;

namespace CourtBooking.API.Endpoints.V1.CourtOwners;

/// <summary>
/// Yêu cầu tạo mới tài khoản Chủ sân (PNG 1).
/// </summary>
public sealed record CreateCourtOwnerRequest(
    string FullName,
    string PhoneNumber,
    string Email,
    bool MustChangePwd = true,
    string? Password = null,
    string? BusinessName = null);

/// <summary>
/// Yêu cầu thay đổi gói dịch vụ SaaS của Chủ sân (PNG 2).
/// </summary>
public sealed record ChangeCourtOwnerPackageRequest(Guid NewPackageId);

/// <summary>
/// Yêu cầu gia hạn thời gian gói dịch vụ của Chủ sân (PNG 3).
/// </summary>
public sealed record ExtendCourtOwnerSubscriptionRequest(int DurationMonths);

/// <summary>
/// Yêu cầu khóa hoặc mở khóa tài khoản Chủ sân.
/// </summary>
public sealed record UpdateCourtOwnerStatusRequest(UserStatus Status);
