using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.SubscribeServicePackage;

/// <summary>
/// Command Chủ sân đăng ký mua hoặc gia hạn gói cước SaaS.
/// </summary>
public sealed record SubscribeServicePackageCommand(Guid PackageId) : ICommand<SubscriptionDto>;
