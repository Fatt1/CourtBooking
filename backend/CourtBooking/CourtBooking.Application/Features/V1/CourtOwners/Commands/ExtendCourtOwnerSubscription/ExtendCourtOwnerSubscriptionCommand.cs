using CourtBooking.Application.Features.V1.CourtOwners.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.ExtendCourtOwnerSubscription;

/// <summary>
/// Command gia hạn gói dịch vụ SaaS cho Chủ sân (PNG 3).
/// Thời gian gia hạn: 1 tháng, 3 tháng, 6 tháng, 12 tháng.
/// Quy tắc: Gia hạn nối tiếp từ ngày hết hạn hoặc từ hôm nay nếu gói đã hết hạn.
/// </summary>
public sealed record ExtendCourtOwnerSubscriptionCommand(
    Guid CourtOwnerId,
    int DurationMonths) : ICommand<CourtOwnerSubscriptionDetailDto>;
