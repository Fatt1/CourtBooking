using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.Products.Commands.Create;
using CourtBooking.SharedKernel.Extensions;
using MediatR;

namespace CourtBooking.API.Endpoints.V1.Products;

public class ProductEndpoints : IEndpointGroup
{
    private const string ProductTag = "Products";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("products");

        // GET /api/v1/products — placeholder
        group.MapGet("/", () => new[] { "Product 1", "Product 2", "Product 3" })
            .WithName("GetProducts")
            .WithTags(ProductTag);

        // POST /api/v1/products — create a new product
        group.MapPost("/", async (
                CreateProductRequest request,
                ISender sender,
                CancellationToken ct) =>
            {
                var command = new CreateProductCommand(
                    request.Name,
                    request.Description,
                    request.Price,
                    request.Stock);
                var result = await sender.Send(command, ct);

                return result.IsSuccess
                    ? Results.Created($"/api/v1/products/{result.Value.Id}", result.Value)
                    : result.ToProblemDetails();
            })
            .WithName("CreateProduct")
            .WithSummary("Create a new product")
            .WithDescription("Returns 201 on success. Returns 400 ProblemDetails if validation fails.")
            .WithTags(ProductTag)
            .Produces<CreateOrderResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}
