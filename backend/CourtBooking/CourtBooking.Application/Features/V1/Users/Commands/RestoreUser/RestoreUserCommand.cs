using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Users.Commands.RestoreUser;

/// <summary>
/// Command khôi phục tài khoản đã bị xóa mềm (IsDeleted = false).
/// </summary>
public sealed record RestoreUserCommand(Guid UserId) : ICommand;
