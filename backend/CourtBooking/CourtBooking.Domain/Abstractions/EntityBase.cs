namespace CourtBooking.Domain.Abstractions;

public abstract class EntityBase<TKey>
{
    public TKey Id { get; set; } = default!;

    protected EntityBase(TKey id) => Id = id;
    protected EntityBase() { }
}
