using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.UpdateCourtOwnerStatus;

/// <summary>
/// Command cập nhật trạng thái hoạt động của Chủ sân (Khóa / Mở khóa tài khoản).
/// </summary>
public sealed record UpdateCourtOwnerStatusCommand(
    Guid CourtOwnerId,
    UserStatus Status) : ICommand;
