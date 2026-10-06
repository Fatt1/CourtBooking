using CourtBooking.Application.Extensions.Paginations;

namespace CourtBooking.Application.Features.V1.ServicePackages.Dtos;

/// <summary>
/// DTO đại diện cho một gói dịch vụ SaaS.
/// </summary>
public sealed record ServicePackageDto(
    Guid Id,
    string Name,
    decimal Price,
    string Description,
    short DurationMonths);

/// <summary>
/// DTO đại diện cho thông tin thuê bao gói cước của Chủ sân.
/// </summary>
public sealed record SubscriptionDto(
    Guid Id,
    Guid ServicePackageId,
    string PackageName,
    decimal PricePaid,
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsActive);

/// <summary>
/// DTO đại diện cho 1 dòng trên bảng Lịch sử đăng ký của Chủ sân (dành cho Admin Console).
/// </summary>
public sealed record SubscriptionHistoryItemDto(
    Guid Id,
    Guid CourtOwnerId,
    string OwnerName,
    string BusinessName,
    string? AvatarInitial,
    string PackageName,
    decimal PricePaid,
    DateOnly StartDate,
    DateOnly EndDate,
    string TransactionCode,
    string Status,
    int DaysRemaining);

/// <summary>
/// DTO phản hồi danh sách lịch sử đăng ký có phân trang kèm số lượng badge "Sắp hết hạn".
/// </summary>
public sealed record SubscriptionHistoryResponse(
    PagedList<SubscriptionHistoryItemDto> Subscriptions,
    int ExpiringSoonCount);
