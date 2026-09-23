namespace CourtBooking.API.Endpoints.V1.Products;

public record CreateProductRequest(
     string Name,
    string Description,
    decimal Price,
    int Stock
    );

