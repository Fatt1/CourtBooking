using CourtBooking.Domain.Entities.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class FixedOrderConfigCourtConfiguration : IEntityTypeConfiguration<FixedOrderConfigCourt>
{
    public void Configure(EntityTypeBuilder<FixedOrderConfigCourt> builder)
    {
        builder.ToTable("FixedOrderConfigCourts");

        builder.HasKey(f => new { f.FixedOrderConfigId, f.CourtId });

        builder.HasIndex(f => f.CourtId)
            .HasDatabaseName("IX_FixedOrderConfigCourts_CourtId");

        // Relationships
        builder.HasOne(f => f.Court)
            .WithMany(c => c.FixedOrderConfigCourts)
            .HasForeignKey(f => f.CourtId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
