using CourtBooking.Domain.Entities.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class RetailOrderConfiguration : IEntityTypeConfiguration<RetailOrder>
{
    public void Configure(EntityTypeBuilder<RetailOrder> builder)
    {
        builder.ToTable("RetailOrder");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.OrderCode)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.CustomerName)
            .HasMaxLength(255);

        builder.Property(r => r.PaymentMethod)
            .IsRequired();

        builder.Property(r => r.TotalAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(r => r.DiscountAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.UpdatedAt).IsRequired();

        // Relationships
        builder.HasMany(r => r.Items)
            .WithOne(i => i.RetailOrder)
            .HasForeignKey(i => i.RetailOrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(r => r.BranchId)
            .HasDatabaseName("IX_RetailOrder_BranchId");

        builder.HasIndex(r => r.OrderCode)
            .IsUnique()
            .HasDatabaseName("UX_RetailOrder_OrderCode");

        builder.HasIndex(r => r.CreatedByUserId)
            .HasDatabaseName("IX_RetailOrder_CreatedByUserId");

        builder.HasOne(r => r.Branch)
            .WithMany(b => b.RetailOrders)
            .HasForeignKey(r => r.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
