using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetServicePackages;

/// <summary>
/// Query lấy danh sách toàn bộ các gói cước SaaS.
/// </summary>
public sealed record GetServicePackagesQuery : IQuery<List<ServicePackageDto>>;
