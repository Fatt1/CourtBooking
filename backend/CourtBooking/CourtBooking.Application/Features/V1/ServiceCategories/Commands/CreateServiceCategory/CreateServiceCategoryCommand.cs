using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Commands.CreateServiceCategory;

public sealed record CreateServiceCategoryCommand(
    string Name,
    string? Description,
    bool IsActive) : ICommand<Guid>;
