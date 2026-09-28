using CourtBooking.Domain.Entities.Reviews;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Reviews");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.BranchId)
            .IsRequired();

        builder.HasIndex(r => r.BranchId)
            .HasDatabaseName("IX_Reviews_BranchId");

        builder.HasIndex(r => r.OrderId)
            .IsUnique();

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(1000);

        builder.Property(r => r.ImageId);

        builder.Property(r => r.CreatedAt)
            .IsRequired();
    }
}
