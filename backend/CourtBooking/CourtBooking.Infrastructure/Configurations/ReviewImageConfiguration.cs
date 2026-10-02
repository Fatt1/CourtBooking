using CourtBooking.Domain.Entities.Reviews;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class ReviewImageConfiguration : IEntityTypeConfiguration<ReviewImage>
{
    public void Configure(EntityTypeBuilder<ReviewImage> builder)
    {
        builder.ToTable("ReviewImages");

        builder.HasKey(ri => ri.Id);
        builder.Property(ri => ri.Id).ValueGeneratedNever();

        builder.Property(ri => ri.ReviewId).IsRequired();
        builder.Property(ri => ri.ImageId).IsRequired();

        builder.HasOne(ri => ri.Review)
            .WithMany(r => r.Images)
            .HasForeignKey(ri => ri.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ri => ri.Image)
            .WithMany()
            .HasForeignKey(ri => ri.ImageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
