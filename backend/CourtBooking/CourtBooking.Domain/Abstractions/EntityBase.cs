namespace CourtBooking.Domain.Abstractions;

public abstract class EntityBase<TKey>
{
    protected EntityBase(TKey id) => Id = id;

    // Parameterless ctor for EF Core
    protected EntityBase() { }

    public TKey Id { get; private set; } = default!;
}
