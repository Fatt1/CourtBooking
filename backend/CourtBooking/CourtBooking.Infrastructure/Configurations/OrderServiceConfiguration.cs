using CourtBooking.Domain.Entities.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class OrderServiceConfiguration : IEntityTypeConfiguration<OrderService>
{
    public void Configure(EntityTypeBuilder<OrderService> builder)
    {
        builder.ToTable("OrderServices");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Quantity).IsRequired();

        builder.Property(s => s.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasIndex(s => s.OrderId)
            .HasDatabaseName("IX_OrderServices_OrderId");

        builder.HasIndex(s => s.ServiceId)
            .HasDatabaseName("IX_OrderServices_ServiceId");
    }
}
