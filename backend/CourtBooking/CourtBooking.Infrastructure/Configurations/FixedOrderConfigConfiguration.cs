using CourtBooking.Domain.Entities.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class FixedOrderConfigConfiguration : IEntityTypeConfiguration<FixedOrderConfig>
{
    public void Configure(EntityTypeBuilder<FixedOrderConfig> builder)
    {
        builder.ToTable("FixedOrderConfigs");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.OrderId)
            .IsRequired();

        builder.HasIndex(f => f.OrderId)
            .HasDatabaseName("IX_FixedOrderConfigs_OrderId");

        builder.Property(f => f.DaysOfWeekMask)
            .IsRequired();

        builder.Property(f => f.StartTime)
            .IsRequired();

        builder.Property(f => f.EndTime)
            .IsRequired();

        builder.Property(f => f.ExceptionDates)
            .HasMaxLength(255);

        // Relationship 1-N with Order (Child entity of Order aggregate)
        builder.HasOne(f => f.Order)
            .WithMany(o => o.FixedConfigs)
            .HasForeignKey(f => f.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationships
        builder.HasMany(f => f.Courts)
            .WithOne(c => c.FixedOrderConfig)
            .HasForeignKey(c => c.FixedOrderConfigId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
