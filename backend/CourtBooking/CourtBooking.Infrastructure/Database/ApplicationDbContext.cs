using CourtBooking.Domain.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Infrastructure.Database;

public class ApplicationDbContext : DbContext
{
    private readonly IPublisher _publisher;
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IPublisher publisher) : base(options)
    {
        _publisher = publisher;
    }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

    }
    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var aggregates = ChangeTracker.Entries<IAggregateRoot>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        var events = aggregates.SelectMany(a => a.DomainEvents).ToList();



        foreach (var @event in events)
            await _publisher.Publish(@event, ct);

        foreach (var aggregate in aggregates)
            aggregate.ClearDomainEvents();

        return await base.SaveChangesAsync(ct);

    }
}
