using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Users.Commands.UpdateUserStatus;

/// <summary>
/// Command cập nhật trạng thái người dùng (Khóa / Mở khóa tài khoản).
/// </summary>
public sealed record UpdateUserStatusCommand(Guid UserId, UserStatus Status) : ICommand;
