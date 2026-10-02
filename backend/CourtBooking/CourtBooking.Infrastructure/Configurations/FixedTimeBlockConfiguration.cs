using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class FixedTimeBlockConfiguration : IEntityTypeConfiguration<FixedTimeBlock>
{
    public void Configure(EntityTypeBuilder<FixedTimeBlock> builder)
    {
        builder.ToTable("FixedTimeBlock");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Id).ValueGeneratedNever();

        builder.Property(f => f.DaysOfWeekMask)
            .IsRequired()
            .HasComment("Lưu theo kiểu bitwise");

        builder.Property(f => f.CreatedAt).IsRequired();
        builder.Property(f => f.UpdatedAt).IsRequired();

        // Relationships
        builder.HasMany(f => f.Courts)
            .WithOne(c => c.FixedTimeBlock)
            .HasForeignKey(c => c.FixedTimeBlockId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => f.CourtTypeId)
            .HasDatabaseName("IX_FixedTimeBlock_CourtTypeId");

        builder.HasOne(f => f.CourtType)
            .WithMany(ct => ct.FixedTimeBlocks)
            .HasForeignKey(f => f.CourtTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
