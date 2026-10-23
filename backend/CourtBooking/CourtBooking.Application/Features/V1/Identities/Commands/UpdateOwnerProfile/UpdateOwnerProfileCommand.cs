using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.UpdateOwnerProfile;

/// <summary>
/// Command cập nhật thông tin cá nhân và thông tin kinh doanh của Chủ sân.
/// </summary>
public sealed record UpdateOwnerProfileCommand(
    string FullName,
    string Email,
    string PhoneNumber,
    string BusinessName,
    string? TaxCode) : ICommand;
