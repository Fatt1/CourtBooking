using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Queries.GetCurrentUser;

/// <summary>
/// Query lấy thông tin chi tiết người dùng đang đăng nhập.
/// </summary>
public sealed record GetCurrentUserQuery : IQuery<CurrentUserDto>;
