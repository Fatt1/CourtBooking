using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Commands.DeleteServiceCategory;

public sealed record DeleteServiceCategoryCommand(Guid Id) : ICommand;
