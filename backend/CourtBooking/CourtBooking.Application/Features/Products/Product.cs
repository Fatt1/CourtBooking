namespace CourtBooking.Application.Features.Products;

/// <summary>
/// Simple Product entity used for demonstrating the Result + ValidationBehavior pipeline.
/// </summary>
public sealed class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public decimal Price { get; private set; }
    public int Stock { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Product() { } // EF / serializer

    public static Product Create(string name, string description, decimal price, int stock)
    {
        return new Product
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Price = price,
            Stock = stock,
            CreatedAt = DateTime.UtcNow
        };
    }
}
