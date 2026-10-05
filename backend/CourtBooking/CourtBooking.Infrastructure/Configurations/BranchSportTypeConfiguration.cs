using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public sealed class BranchSportTypeConfiguration : IEntityTypeConfiguration<BranchSportType>
{
    public void Configure(EntityTypeBuilder<BranchSportType> builder)
    {
        builder.ToTable("BranchSportTypes");
        builder.HasKey(x => new { x.BranchId, x.SportTypeId });
        builder.HasOne(x => x.Branch)
            .WithMany(x => x.BranchSportTypes)
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.SportType)
            .WithMany(x => x.BranchSportTypes)
            .HasForeignKey(x => x.SportTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => x.SportTypeId);
    }
}
