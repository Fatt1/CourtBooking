using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.CreateCourtOwner;

/// <summary>
/// Command khởi tạo tài khoản đối tác Chủ sân mới từ Admin Console (PNG 1).
/// </summary>
public sealed record CreateCourtOwnerCommand(
    string FullName,
    string PhoneNumber,
    string Email,
    bool MustChangePwd = true,
    string? Password = null,
    string? BusinessName = null) : ICommand<Guid>;
