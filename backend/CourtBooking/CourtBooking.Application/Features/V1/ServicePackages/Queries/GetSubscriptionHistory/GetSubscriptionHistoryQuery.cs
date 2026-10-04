using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetSubscriptionHistory;

/// <summary>
/// Query lấy danh sách lịch sử đăng ký gói cước của các chủ sân (Admin Console).
/// </summary>
public sealed record GetSubscriptionHistoryQuery(
    string? Search = null,
    string? Status = null,
    int Page = 1,
    int PageSize = 10) : IQuery<SubscriptionHistoryResponse>;
