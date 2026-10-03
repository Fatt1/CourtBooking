using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Events.Queries.GetPublicEventById;

/// <summary>
/// Query lấy thông tin chi tiết sự kiện thể thao công khai theo Id.
/// </summary>
public sealed record GetPublicEventByIdQuery(Guid Id) : IQuery<EventDetailDto>;
