using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetMyOrders;

public sealed record MyOrderDto(
    Guid Id,
    string OrderCode,
    Guid BranchId,
    string BranchName,
    string BranchAddress,
    string CourtName,
    Guid? SportTypeId,
    string? SportTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal TotalAmount,
    OrderStatus Status,
    bool HasSocialMatch,
    Guid? SocialMatchId,
    bool CanCreateMatch,
    DateTime? HoldExpiresAt,
    bool CanPay,
    string? AccountNumber,
    string? AccountName,
    string? QrCodeImageKey,
    bool HasReviewed,
    DateTime CreatedAt);
