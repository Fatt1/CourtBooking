using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id).ValueGeneratedNever();

        builder.Property(o => o.OrderCode)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(o => o.CustomerName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(o => o.CustomerPhone)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(o => o.Channel)
            .HasConversion<byte>()
            .IsRequired();

        builder.Property(o => o.TotalCourtAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(o => o.TotalServiceAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(o => o.DiscountAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.Status)
            .HasConversion<byte>()
            .HasDefaultValue(OrderStatus.AwaitingPayment);

        builder.Property(o => o.OrderType)
            .HasConversion<byte>()
            .IsRequired();

        builder.Property(o => o.CancelReason)
            .HasMaxLength(255);

        builder.Property(o => o.Note)
            .HasMaxLength(255);

        builder.Property(o => o.CreatedAt).IsRequired();
        builder.Property(o => o.UpdatedAt).IsRequired();

        // Relationships
        builder.HasOne(o => o.Branch)
            .WithMany(b => b.Orders)
            .HasForeignKey(o => o.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Player)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Details)
            .WithOne(d => d.Order)
            .HasForeignKey(d => d.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Services)
            .WithOne(s => s.Order)
            .HasForeignKey(s => s.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.FixedConfigs)
            .WithOne(f => f.Order)
            .HasForeignKey(f => f.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.PaymentTransactions)
            .WithOne(p => p.Order)
            .HasForeignKey(p => p.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Reviews)
            .WithOne(r => r.Order)
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(o => o.BranchId)
            .HasDatabaseName("IX_Orders_BranchId");

        builder.HasIndex(o => o.PlayerId)
            .HasDatabaseName("IX_Orders_PlayerId");

        builder.HasIndex(o => o.HoldExpiresAt)
            .HasDatabaseName("IX_Orders_HoldExpiresAt")
            .HasFilter("[Status] = 0");
    }
}
