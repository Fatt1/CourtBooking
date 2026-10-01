using CourtBooking.Domain.Entities.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class OrderDetailConfiguration : IEntityTypeConfiguration<OrderDetail>
{
    public void Configure(EntityTypeBuilder<OrderDetail> builder)
    {
        builder.ToTable("OrdersDetails");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id).ValueGeneratedNever();

        builder.Property(d => d.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        // Indexes
        builder.HasIndex(d => d.OrderId)
            .HasDatabaseName("IX_OrdersDetails_OrderId");

        builder.HasIndex(d => new { d.CourtId, d.Date, d.StartTime })
            .HasDatabaseName("IX_OrdersDetails_CourtId_Date_StartTime");

        // Relationships
        builder.HasOne(d => d.Court)
            .WithMany(c => c.OrderDetails)
            .HasForeignKey(d => d.CourtId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
