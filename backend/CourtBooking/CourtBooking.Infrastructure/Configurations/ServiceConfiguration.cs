using CourtBooking.Domain.Entities.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.ToTable("Services");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id).ValueGeneratedNever();

        builder.Property(s => s.Name)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(s => s.Unit)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.ImageId);

        builder.Property(s => s.CreatedAt).IsRequired();
        builder.Property(s => s.UpdatedAt).IsRequired();

        // Relationships
        builder.HasOne(s => s.Category)
            .WithMany(c => c.Services)
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(s => s.Image)
            .WithMany()
            .HasForeignKey(s => s.ImageId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(s => s.Branches)
            .WithOne(sb => sb.Service)
            .HasForeignKey(sb => sb.ServiceId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(s => s.CategoryId)
            .HasDatabaseName("IX_Services_CategoryId");
    }
}
