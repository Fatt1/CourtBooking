---
name: ddd
description: >
  Domain-Driven Design tactical patterns for .NET applications. Covers aggregates,
  aggregate roots, domain events, domain services, and repository patterns for aggregate persistence.
  Does NOT use value objects or strongly-typed IDs — primitive types (Guid, string, decimal) are used directly.
  Load this skill when implementing DDD, working with aggregates, domain events,
  bounded contexts, or when the architecture-advisor recommends DDD + Clean Architecture.
---

# Domain-Driven Design (DDD)

## Core Principles

1. **Aggregates define consistency boundaries** — An aggregate is a cluster of entities treated as a single unit for data changes. All invariants within an aggregate are enforced in a single transaction. Cross-aggregate consistency is eventual.
2. **Domain events decouple side effects** — When something meaningful happens in the domain (OrderPlaced, PaymentReceived), raise a domain event. Side effects (send email, update read model, notify another aggregate) subscribe to these events. The aggregate stays focused on its own rules.
3. **Aggregate root is the sole entry point** — External code accesses an aggregate only through its root entity. Child entities are never loaded or modified independently. The root enforces all invariants for the entire aggregate.
4. **Repositories persist aggregates, not entities** — One repository per aggregate root. The repository loads and saves the entire aggregate as a unit. No repository for child entities.
5. **Primitives for IDs and values** — Use `Guid` for entity IDs, `string`/`decimal`/`int` for value properties. No strongly-typed IDs, no value object wrappers.

## Base Classes (Project Abstractions)

```csharp
// Domain/Abstractions/EntityBase.cs
public abstract class EntityBase<TKey>
{
    protected EntityBase(TKey id) => Id = id;
    protected EntityBase() { } // EF Core

    public TKey Id { get; private set; } = default!;
}

// Domain/Abstractions/AggregateRoot.cs
public abstract class AggregateRoot<TKey> : EntityBase<TKey>
{
    private readonly List<IDomainEvent> _domainEvents = [];

    protected AggregateRoot(TKey id) : base(id) { }
    protected AggregateRoot() { } // EF Core

    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    protected void RaiseDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}

// Domain/Abstractions/AuditableAggregateRoot.cs — use when you need CreatedAt/UpdatedAt
public abstract class AuditableAggregateRoot<TKey> : AggregateRoot<TKey>, IAuditableEntity
{
    protected AuditableAggregateRoot(TKey id) : base(id) { }
    protected AuditableAggregateRoot() { } // EF Core

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

## Patterns

### Aggregate Root

The aggregate root owns all access to its children and enforces invariants.
Use `Guid` directly for IDs, plain C# types for all properties:

```csharp
// Domain/Orders/Order.cs
public sealed class Order : AuditableAggregateRoot<Guid>
{
    private readonly List<OrderLine> _lines = [];

    private Order() { } // EF Core

    public Guid CustomerId { get; private set; }
    public string OrderNumber { get; private set; } = null!;
    public decimal Total { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTimeOffset PlacedAt { get; private set; }
    public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();

    public static Order Place(Guid customerId, string orderNumber, DateTimeOffset now)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            OrderNumber = orderNumber,
            Status = OrderStatus.Placed,
            PlacedAt = now
        };

        order.RaiseDomainEvent(new OrderPlacedEvent(order.Id, customerId, now));
        return order;
    }

    public Result AddLine(Guid productId, int quantity, decimal unitPrice)
    {
        if (Status is not OrderStatus.Placed)
            return Result.Failure(new ConflictError("Cannot modify a confirmed or cancelled order."));

        if (quantity <= 0)
            return Result.Failure(new FieldError("Quantity", "Quantity must be positive."));

        var existing = _lines.FirstOrDefault(l => l.ProductId == productId);
        if (existing is not null)
            existing.IncreaseQuantity(quantity);
        else
            _lines.Add(new OrderLine(productId, quantity, unitPrice));

        RecalculateTotal();
        return Result.Success();
    }

    public Result Confirm()
    {
        if (Status is not OrderStatus.Placed)
            return Result.Failure(new ConflictError("Only placed orders can be confirmed."));

        if (_lines.Count == 0)
            return Result.Failure(new ConflictError("Cannot confirm an order with no lines."));

        Status = OrderStatus.Confirmed;
        RaiseDomainEvent(new OrderConfirmedEvent(Id));
        return Result.Success();
    }

    private void RecalculateTotal() =>
        Total = _lines.Sum(l => l.UnitPrice * l.Quantity);
}
```

### Domain Events

Raise events inside aggregates, dispatch after `SaveChangesAsync`:

```csharp
// Domain/Common/IDomainEvent.cs
public interface IDomainEvent : INotification { }

// Domain/Orders/Events/OrderPlacedEvent.cs
public sealed record OrderPlacedEvent(
    Guid OrderId,
    Guid CustomerId,
    DateTimeOffset PlacedAt) : IDomainEvent;

// Domain/Orders/Events/OrderConfirmedEvent.cs
public sealed record OrderConfirmedEvent(Guid OrderId) : IDomainEvent;
```

### Dispatching in DbContext

```csharp
// Infrastructure/Persistence/AppDbContext.cs
public class AppDbContext(DbContextOptions<AppDbContext> options, IPublisher publisher)
    : DbContext(options)
{
    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        // Collect events BEFORE saving (so EF hasn't cleared tracked state)
        var aggregates = ChangeTracker.Entries<AggregateRoot<Guid>>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        var result = await base.SaveChangesAsync(ct);

        // Dispatch AFTER saving so events fire on committed data
        foreach (var aggregate in aggregates)
        {
            foreach (var @event in aggregate.DomainEvents)
                await publisher.Publish(@event, ct);

            aggregate.ClearDomainEvents();
        }

        return result;
    }
}
```



### Domain Services

For logic that coordinates multiple aggregates or requires external data:

```csharp
// Domain/Orders/Services/PricingService.cs
public sealed class PricingService(IDiscountRepository discounts)
{
    public async Task<decimal> CalculatePriceAsync(
        Guid customerId, Guid productId, int quantity, decimal unitPrice,
        CancellationToken ct = default)
    {
        var discountRate = await discounts.GetRateAsync(customerId, productId, ct);
        var subtotal = unitPrice * quantity;
        return subtotal * (1 - discountRate);
    }
}
```

## Anti-patterns

### Anemic Aggregates

```csharp
// BAD — aggregate is just a data bag, handler does all the work
public class Order : AggregateRoot<Guid>
{
    public OrderStatus Status { get; set; }  // public setter!
    public List<OrderLine> Lines { get; set; } = [];
}
// Handler directly mutates:
order.Status = OrderStatus.Confirmed;  // no invariant check!
order.Lines.Add(newLine);              // no validation!

// GOOD — aggregate encapsulates rules
order.Confirm();         // validates status, raises event
order.AddLine(...);      // validates, recalculates total
```

### Oversized Aggregates

```csharp
// BAD — Customer owns everything
public class Customer : AggregateRoot<Guid>
{
    public List<Order> Orders { get; } = [];    // separate aggregate
    public List<Payment> Payments { get; } = []; // separate aggregate
}

// GOOD — small focused aggregates linked by Guid ID
public class Customer : AuditableAggregateRoot<Guid>
{
    public string FullName { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    // Orders and Payments reference CustomerId (Guid) independently
}
```

### Domain Events for Intra-Aggregate Logic

```csharp
// BAD — event for logic within the same aggregate
order.RaiseDomainEvent(new OrderLineAdded(line));
// ...handler then recalculates total — but it's the same aggregate!

// GOOD — private method, no event needed
_lines.Add(line);
RecalculateTotal();
```

## Decision Guide

| Scenario | Recommendation |
|---|---|
| Entity ID type | `Guid` — use `Guid.NewGuid()` in factory method |
| When to use DDD | Complex domain with business rules beyond CRUD |
| Aggregate size | Small — 1 root + 0–3 child entities max |
| Need audit fields? | Inherit `AuditableAggregateRoot<Guid>` instead of `AggregateRoot<Guid>` |
| Domain vs integration events | Domain: within bounded context, same transaction. Integration: cross-context, via message bus |
| When NOT to use DDD | Simple CRUD, settings, audit logs, read models — plain entities + EF Core suffice |
| Repository vs DbContext | Repository per aggregate root; direct DbContext for read-only queries |
| Domain services | Only when logic requires multiple aggregates or external data |
