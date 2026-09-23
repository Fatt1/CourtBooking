namespace CourtBooking.Domain.Abstractions;


public abstract class AggregateRoot<TKey> : EntityBase<TKey>, IAggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = [];

    protected AggregateRoot(TKey id) : base(id) { }
    protected AggregateRoot() { } // EF Core

    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void RaiseDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}
