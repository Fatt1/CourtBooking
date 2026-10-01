using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class BranchImageConfiguration : IEntityTypeConfiguration<BranchImage>
{
    public void Configure(EntityTypeBuilder<BranchImage> builder)
    {
        builder.ToTable("BranchImages");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id).ValueGeneratedNever();

        builder.Property(i => i.ImageId)
            .IsRequired();

        builder.Property(i => i.DisplayOrder)
            .HasDefaultValue(0);

        builder.HasIndex(i => i.BranchId)
            .HasDatabaseName("IX_BranchImages_BranchId");

        builder.HasIndex(i => i.ImageId)
            .HasDatabaseName("IX_BranchImages_ImageId");

        builder.HasOne(i => i.Image)
            .WithMany()
            .HasForeignKey(i => i.ImageId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
