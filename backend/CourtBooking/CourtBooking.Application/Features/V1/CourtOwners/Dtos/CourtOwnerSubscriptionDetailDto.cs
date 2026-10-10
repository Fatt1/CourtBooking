namespace CourtBooking.Application.Features.V1.CourtOwners.Dtos;

/// <summary>
/// DTO chi tiết gói cước của Chủ sân sau khi thao tác Đổi gói hoặc Gia hạn.
/// </summary>
public sealed record CourtOwnerSubscriptionDetailDto(
    Guid SubscriptionId,
    Guid CourtOwnerId,
    Guid PackageId,
    string PackageName,
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsActive);
