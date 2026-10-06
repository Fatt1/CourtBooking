using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.CreateServicePackage;

/// <summary>
/// Command Quản trị viên sàn tạo gói cước SaaS mới.
/// </summary>
public sealed record CreateServicePackageCommand(
    string Name,
    decimal Price,
    string Description,
    short DurationMonths) : ICommand<ServicePackageDto>;
