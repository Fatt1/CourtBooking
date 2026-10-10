using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Users.Commands.SoftDeleteUser;

/// <summary>
/// Command đánh dấu xóa mềm một người dùng (IsDeleted = true).
/// </summary>
public sealed record SoftDeleteUserCommand(Guid UserId) : ICommand;
