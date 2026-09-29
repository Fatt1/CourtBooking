using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class SportTypeConfiguration : IEntityTypeConfiguration<SportType>
{
    public void Configure(EntityTypeBuilder<SportType> builder)
    {
        builder.ToTable("SportType");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.ImageId);

        builder.Property(s => s.IsActive)
            .HasDefaultValue(true);

        // Relationships
        builder.HasOne(s => s.Image)
            .WithMany()
            .HasForeignKey(s => s.ImageId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(s => s.Branches)
            .WithOne(b => b.SportType)
            .HasForeignKey(b => b.SportTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.Events)
            .WithOne(e => e.SportType)
            .HasForeignKey(e => e.SportTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.SocialMatches)
            .WithOne(sm => sm.SportType)
            .HasForeignKey(sm => sm.SportTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
