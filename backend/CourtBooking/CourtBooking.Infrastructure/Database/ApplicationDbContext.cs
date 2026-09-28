using CourtBooking.Application.Data;
using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Events;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Payments;
using CourtBooking.Domain.Entities.Reviews;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Entities.Subscriptions;
using CourtBooking.Domain.Entities.Users;
using MediatR;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Infrastructure.Database;

public class ApplicationDbContext
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>, IApplicationDbContext
{
    private readonly IPublisher _publisher;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IPublisher publisher)
        : base(options)
    {
        _publisher = publisher;
    }

    // ── Identity / Users ──────────────────────────────────────
    public DbSet<PlayerProfile> PlayerProfiles => Set<PlayerProfile>();
    public DbSet<CourtOwner> CourtOwners => Set<CourtOwner>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // ── Courts ────────────────────────────────────────────────
    public DbSet<SportType> SportTypes => Set<SportType>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<BranchImage> BranchImages => Set<BranchImage>();
    public DbSet<CourtType> CourtTypes => Set<CourtType>();
    public DbSet<Court> Courts => Set<Court>();
    public DbSet<PriceTable> PriceTables => Set<PriceTable>();
    public DbSet<PriceTableRule> PriceTableRules => Set<PriceTableRule>();
    public DbSet<FixedTimeBlock> FixedTimeBlocks => Set<FixedTimeBlock>();
    public DbSet<FixedTimeBlockCourt> FixedTimeBlockCourts => Set<FixedTimeBlockCourt>();

    // ── Orders ────────────────────────────────────────────────
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();
    public DbSet<OrderService> OrderServices => Set<OrderService>();
    public DbSet<FixedOrderConfig> FixedOrderConfigs => Set<FixedOrderConfig>();
    public DbSet<FixedOrderConfigCourt> FixedOrderConfigCourts => Set<FixedOrderConfigCourt>();

    // ── Matches ───────────────────────────────────────────────
    public DbSet<SocialMatch> SocialMatches => Set<SocialMatch>();
    public DbSet<MatchParticipant> MatchParticipants => Set<MatchParticipant>();

    // ── Events ────────────────────────────────────────────────
    public DbSet<SportEvent> SportEvents => Set<SportEvent>();
    public DbSet<EventTicket> EventTickets => Set<EventTicket>();

    // ── Services ──────────────────────────────────────────────
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<ServiceBranch> ServiceBranches => Set<ServiceBranch>();
    public DbSet<RetailOrder> RetailOrders => Set<RetailOrder>();
    public DbSet<RetailOrderItem> RetailOrderItems => Set<RetailOrderItem>();

    // ── Payments ──────────────────────────────────────────────
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

    // ── Reviews ───────────────────────────────────────────────
    public DbSet<Review> Reviews => Set<Review>();

    // ── Subscriptions ─────────────────────────────────────────
    public DbSet<ServicePackage> ServicePackages => Set<ServicePackage>();
    public DbSet<CourtOwnerSubscription> CourtOwnerSubscriptions => Set<CourtOwnerSubscription>();

    // ── Images ────────────────────────────────────────────────
    public DbSet<Image> Images => Set<Image>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder); // Required for Identity tables
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        // Collect events BEFORE saving
        var aggregates = ChangeTracker.Entries<IAggregateRoot>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        var result = await base.SaveChangesAsync(ct);

        // Dispatch AFTER saving so events fire on committed data
        foreach (var aggregate in aggregates)
        {
            foreach (var @event in aggregate.DomainEvents)
                await _publisher.Publish(@event, ct);

            aggregate.ClearDomainEvents();
        }

        return result;
    }
}
