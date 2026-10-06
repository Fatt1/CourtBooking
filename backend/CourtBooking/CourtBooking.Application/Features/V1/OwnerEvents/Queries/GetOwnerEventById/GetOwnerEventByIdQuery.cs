using CourtBooking.Application.Features.V1.OwnerEvents.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetOwnerEventById;

/// <summary>
/// Query lấy chi tiết sự kiện cho Chủ sân nạp vào Modal Cập nhật sự kiện.
/// </summary>
public sealed record GetOwnerEventByIdQuery(Guid EventId) : IQuery<OwnerEventDetailDto>;
