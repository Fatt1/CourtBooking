using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetCurrentSubscription;

/// <summary>
/// Query lấy thông tin thuê bao hiện tại của Chủ sân đang đăng nhập.
/// </summary>
public sealed record GetCurrentSubscriptionQuery : IQuery<SubscriptionDto?>;
