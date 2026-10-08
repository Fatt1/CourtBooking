using CourtBooking.Domain.Enums;

namespace CourtBooking.API.Endpoints.V1.Users;

/// <summary>
/// Yêu cầu cập nhật trạng thái hoạt động của người dùng (Khóa / Mở khóa).
/// </summary>
public sealed record UpdateUserStatusRequest(UserStatus Status);
