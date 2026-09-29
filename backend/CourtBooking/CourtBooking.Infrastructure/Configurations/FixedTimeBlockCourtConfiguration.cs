using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class FixedTimeBlockCourtConfiguration : IEntityTypeConfiguration<FixedTimeBlockCourt>
{
    public void Configure(EntityTypeBuilder<FixedTimeBlockCourt> builder)
    {
        builder.ToTable("FixedTimeBlockCourts");

        // Composite PK on (FixedTimeBlockId, CourtId)
        builder.HasKey(f => new { f.FixedTimeBlockId, f.CourtId });

        builder.HasOne(f => f.Court)
            .WithMany(c => c.FixedTimeBlockCourts)
            .HasForeignKey(f => f.CourtId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => f.CourtId)
            .HasDatabaseName("IX_FixedTimeBlockCourts_CourtId");
    }
}
