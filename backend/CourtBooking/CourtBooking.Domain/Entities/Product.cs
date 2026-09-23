using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities;

// Example
public class Product : AggregateRoot<int>, ISoftDelete, IAuditable
{
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
