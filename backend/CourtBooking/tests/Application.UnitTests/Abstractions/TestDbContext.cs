using CourtBooking.Application.Data;
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
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Abstractions;

/// <summary>
/// A lightweight in-memory <see cref="DbContext"/> that implements <see cref="IApplicationDbContext"/>
/// so Application handlers can be unit tested without referencing the Infrastructure layer.
/// </summary>
public sealed class TestDbContext(DbContextOptions<TestDbContext> options)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<PlayerProfile> PlayerProfiles => Set<PlayerProfile>();
    public DbSet<CourtOwner> CourtOwners => Set<CourtOwner>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<SportType> SportTypes => Set<SportType>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<BranchSportType> BranchSportTypes => Set<BranchSportType>();
    public DbSet<BranchImage> BranchImages => Set<BranchImage>();
    public DbSet<CourtType> CourtTypes => Set<CourtType>();
    public DbSet<Court> Courts => Set<Court>();
    public DbSet<PriceTable> PriceTables => Set<PriceTable>();
    public DbSet<PriceTableRule> PriceTableRules => Set<PriceTableRule>();
    public DbSet<FixedTimeBlock> FixedTimeBlocks => Set<FixedTimeBlock>();
    public DbSet<FixedTimeBlockCourt> FixedTimeBlockCourts => Set<FixedTimeBlockCourt>();

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();
    public DbSet<OrderService> OrderServices => Set<OrderService>();
    public DbSet<FixedOrderConfig> FixedOrderConfigs => Set<FixedOrderConfig>();
    public DbSet<FixedOrderConfigCourt> FixedOrderConfigCourts => Set<FixedOrderConfigCourt>();

    public DbSet<SocialMatch> SocialMatches => Set<SocialMatch>();
    public DbSet<MatchParticipant> MatchParticipants => Set<MatchParticipant>();

    public DbSet<SportEvent> SportEvents => Set<SportEvent>();
    public DbSet<EventTicket> EventTickets => Set<EventTicket>();

    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<ServiceBranch> ServiceBranches => Set<ServiceBranch>();
    public DbSet<RetailOrder> RetailOrders => Set<RetailOrder>();
    public DbSet<RetailOrderItem> RetailOrderItems => Set<RetailOrderItem>();

    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

    public DbSet<Review> Reviews => Set<Review>();

    public DbSet<ServicePackage> ServicePackages => Set<ServicePackage>();
    public DbSet<CourtOwnerSubscription> CourtOwnerSubscriptions => Set<CourtOwnerSubscription>();

    public DbSet<Image> Images => Set<Image>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CourtBooking.Infrastructure.Database.ApplicationDbContext).Assembly);
    }
}
