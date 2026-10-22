using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetOwnerSubscriptionMe;

/// <summary>
/// Query lấy thông tin gói dịch vụ hiện tại và lịch sử gói dịch vụ của Chủ sân đang đăng nhập.
/// </summary>
public sealed record GetOwnerSubscriptionMeQuery : IQuery<OwnerSubscriptionMeResponse>;
