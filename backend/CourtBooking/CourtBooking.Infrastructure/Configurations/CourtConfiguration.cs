using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class CourtConfiguration : IEntityTypeConfiguration<Court>
{
    public void Configure(EntityTypeBuilder<Court> builder)
    {
        builder.ToTable("Courts");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CourtTypeId)
            .HasColumnName("CourtTyped") // Note: typo preserved from DB schema
            .IsRequired();

        builder.Property(c => c.Name)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(c => c.Status)
            .HasConversion<byte>()
            .HasDefaultValue(CourtStatus.Available);

        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        builder.HasIndex(c => c.CourtTypeId)
            .HasDatabaseName("IX_Courts_CourtTyped");

        // Relationships
        builder.HasOne(c => c.CourtType)
            .WithMany(ct => ct.Courts)
            .HasForeignKey(c => c.CourtTypeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.OrderDetails)
            .WithOne(od => od.Court)
            .HasForeignKey(od => od.CourtId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.FixedTimeBlockCourts)
            .WithOne(ftbc => ftbc.Court)
            .HasForeignKey(ftbc => ftbc.CourtId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.FixedOrderConfigCourts)
            .WithOne(focc => focc.Court)
            .HasForeignKey(focc => focc.CourtId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
