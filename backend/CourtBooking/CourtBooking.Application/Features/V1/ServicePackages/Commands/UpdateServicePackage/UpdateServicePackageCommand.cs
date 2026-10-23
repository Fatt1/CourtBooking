using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.UpdateServicePackage;

public sealed record UpdateServicePackageCommand(
    Guid Id,
    string Name,
    decimal Price,
    string Description,
    short DurationMonths) : ICommand<ServicePackageDto>;
