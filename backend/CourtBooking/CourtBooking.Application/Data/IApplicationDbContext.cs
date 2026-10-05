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

namespace CourtBooking.Application.Data;

public interface IApplicationDbContext
{

    // ── Identity / Users ──────────────────────────────────────
    DbSet<PlayerProfile> PlayerProfiles { get; }
    DbSet<CourtOwner> CourtOwners { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    // ── Courts ────────────────────────────────────────────────
    DbSet<SportType> SportTypes { get; }
    DbSet<Branch> Branches { get; }
    DbSet<BranchSportType> BranchSportTypes { get; }
    DbSet<BranchImage> BranchImages { get; }
    DbSet<CourtType> CourtTypes { get; }
    DbSet<Court> Courts { get; }
    DbSet<PriceTable> PriceTables { get; }
    DbSet<PriceTableRule> PriceTableRules { get; }
    DbSet<FixedTimeBlock> FixedTimeBlocks { get; }
    DbSet<FixedTimeBlockCourt> FixedTimeBlockCourts { get; }

    // ── Orders ────────────────────────────────────────────────
    DbSet<Order> Orders { get; }
    DbSet<OrderDetail> OrderDetails { get; }
    DbSet<OrderService> OrderServices { get; }
    DbSet<FixedOrderConfig> FixedOrderConfigs { get; }
    DbSet<FixedOrderConfigCourt> FixedOrderConfigCourts { get; }

    // ── Matches ───────────────────────────────────────────────
    DbSet<SocialMatch> SocialMatches { get; }
    DbSet<MatchParticipant> MatchParticipants { get; }

    // ── Events ────────────────────────────────────────────────
    DbSet<SportEvent> SportEvents { get; }
    DbSet<EventTicket> EventTickets { get; }

    // ── Services ──────────────────────────────────────────────
    DbSet<ServiceCategory> ServiceCategories { get; }
    DbSet<Service> Services { get; }
    DbSet<ServiceBranch> ServiceBranches { get; }
    DbSet<RetailOrder> RetailOrders { get; }
    DbSet<RetailOrderItem> RetailOrderItems { get; }


    // ── Payments ──────────────────────────────────────────────
    DbSet<PaymentTransaction> PaymentTransactions { get; }

    // ── Reviews ───────────────────────────────────────────────
    DbSet<Review> Reviews { get; }

    // ── Subscriptions ─────────────────────────────────────────
    DbSet<ServicePackage> ServicePackages { get; }
    DbSet<CourtOwnerSubscription> CourtOwnerSubscriptions { get; }

    // ── Images ────────────────────────────────────────────────
    DbSet<Image> Images { get; }

    // ── Database / Transactions ──────────────────────────────
    Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
