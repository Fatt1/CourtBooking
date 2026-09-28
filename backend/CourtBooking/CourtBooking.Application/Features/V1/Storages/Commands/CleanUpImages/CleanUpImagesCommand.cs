using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Storages.Commands.CleanUpImages;

public sealed record CleanUpImagesCommand : ICommand<int>;
