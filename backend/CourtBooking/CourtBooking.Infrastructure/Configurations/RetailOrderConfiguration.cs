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
    }
}
