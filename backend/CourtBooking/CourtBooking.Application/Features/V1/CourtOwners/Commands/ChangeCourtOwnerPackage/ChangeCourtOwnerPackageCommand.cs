using CourtBooking.Application.Features.V1.CourtOwners.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.ChangeCourtOwnerPackage;

/// <summary>
/// Command thay đổi gói dịch vụ SaaS cho Chủ sân (PNG 2).
/// Quy tắc: Gói hiện tại sẽ được thay bằng gói mới. Ngày hết hạn hiện tại được giữ nguyên.
/// </summary>
public sealed record ChangeCourtOwnerPackageCommand(
    Guid CourtOwnerId,
    Guid NewPackageId) : ICommand<CourtOwnerSubscriptionDetailDto>;
