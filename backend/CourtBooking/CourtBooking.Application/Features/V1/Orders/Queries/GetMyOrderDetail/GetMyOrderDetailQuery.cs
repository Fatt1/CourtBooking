using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetMyOrderDetail;

public sealed record GetMyOrderDetailQuery(Guid OrderId) : IQuery<MyOrderDetailResponse>;

public sealed record MyOrderDetailSlotItemDto(
    Guid OrderDetailId,
    Guid CourtId,
    string CourtName,
    Guid? CourtTypeId,
    string? CourtTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal Price);

public sealed record MyOrderDetailServiceItemDto(
    Guid ServiceId,
    string ServiceName,
    string? Unit,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice);

public sealed record MyOrderDetailResponse(
    Guid Id,
    string OrderCode,
    Guid BranchId,
    string BranchName,
    string BranchAddress,
    string? BranchPhone,
    string? SportTypeName,
    OrderStatus Status,
    OrderType OrderType,
    OrderChannel Channel,
    DateTime CreatedAt,
    DateTime? HoldExpiresAt,
    string? Note,
    string? CancelReason,
    string CustomerName,
    string CustomerPhone,
    decimal TotalCourtAmount,
    decimal TotalServiceAmount,
    decimal DiscountAmount,
    decimal TotalAmount,
    bool CanPay,
    string? AccountNumber,
    string? AccountName,
    string? QrCodeImageKey,
    bool HasSocialMatch,
    Guid? SocialMatchId,
    bool CanCreateMatch,
    bool HasReviewed,
    byte? ReviewRating,
    string? ReviewComment,
    List<MyOrderDetailSlotItemDto> Slots,
    List<MyOrderDetailServiceItemDto> Services);
