using CourtBooking.Domain.Entities.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class RetailOrderItemConfiguration : IEntityTypeConfiguration<RetailOrderItem>
{
    public void Configure(EntityTypeBuilder<RetailOrderItem> builder)
    {
        builder.ToTable("RetailOrderItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id).ValueGeneratedNever();

        builder.Property(i => i.Quantity).IsRequired();

        builder.Property(i => i.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasIndex(i => i.RetailOrderId)
            .HasDatabaseName("IX_RetailOrderItems_RetailOrderId");

        builder.HasIndex(i => i.ServiceId)
            .HasDatabaseName("IX_RetailOrderItems_ServiceId");

        // Relationships
        builder.HasOne(i => i.Service)
            .WithMany()
            .HasForeignKey(i => i.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
