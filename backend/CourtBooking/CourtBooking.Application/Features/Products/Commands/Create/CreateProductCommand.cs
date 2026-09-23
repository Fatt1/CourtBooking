using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.Products.Commands.Create;

public record CreateProductCommand(
    string Name,
    string Description,
    decimal Price,
    int Stock)
    : ICommand<CreateOrderResponse>;

public record CreateOrderResponse(
    Guid Id,
    string Name,
    decimal Price,
    int Stock);
