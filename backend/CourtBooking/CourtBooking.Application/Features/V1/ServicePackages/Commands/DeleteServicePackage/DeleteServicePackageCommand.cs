using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.DeleteServicePackage;

public sealed record DeleteServicePackageCommand(Guid Id) : ICommand;
