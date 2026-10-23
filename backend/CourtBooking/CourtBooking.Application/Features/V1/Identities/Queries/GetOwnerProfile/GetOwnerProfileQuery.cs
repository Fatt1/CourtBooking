using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Queries.GetOwnerProfile;

/// <summary>
/// Query lấy thông tin hồ sơ cá nhân và gói dịch vụ của Chủ sân.
/// </summary>
public sealed record GetOwnerProfileQuery : IQuery<OwnerProfileDto>;
