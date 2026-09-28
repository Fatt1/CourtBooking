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
    }
}
