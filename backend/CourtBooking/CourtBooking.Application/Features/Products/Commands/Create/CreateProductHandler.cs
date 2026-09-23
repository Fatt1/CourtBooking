using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.Products.Commands.Create;

public class CreateProductHandler : ICommandHandler<CreateProductCommand, CreateOrderResponse>
{
    public Task<Result<CreateOrderResponse>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        // TODO: inject IProductRepository and persist.
        var product = Product.Create(
            request.Name,
            request.Description,
            request.Price,
            request.Stock);

        var response = new CreateOrderResponse(
            product.Id,
            product.Name,
            product.Price,
            product.Stock);

        return Task.FromResult(Result.Success(response));
    }
}
