using CourtBooking.Domain.Entities.Events;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class SportEventConfiguration : IEntityTypeConfiguration<SportEvent>
{
    public void Configure(EntityTypeBuilder<SportEvent> builder)
    {
        builder.ToTable("Events");

        builder.HasKey(e => e.Id);

        builder.HasIndex(e => e.OrderId)
            .IsUnique();

        builder.Property(e => e.Title)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.SkillLevelFrom)
            .HasMaxLength(50);

        builder.Property(e => e.SkillLevelTo)
            .HasMaxLength(50);

        builder.Property(e => e.TicketPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(e => e.Status)
            .HasConversion<byte>()
            .HasDefaultValue(EventStatus.Open)
            .HasComment("0:Open, 1:Full, 2:Closed, 3:Cancelled");

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        // Relationships
        builder.HasOne(e => e.Order)
            .WithOne(o => o.SportEvent)
            .HasForeignKey<SportEvent>(e => e.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.SportType)
            .WithMany(s => s.Events)
            .HasForeignKey(e => e.SportTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Tickets)
            .WithOne(t => t.Event)
            .HasForeignKey(t => t.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.SportTypeId)
            .HasDatabaseName("IX_Events_SportTypeId");
    }
}
