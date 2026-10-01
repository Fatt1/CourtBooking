using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class MatchParticipantConfiguration : IEntityTypeConfiguration<MatchParticipant>
{
    public void Configure(EntityTypeBuilder<MatchParticipant> builder)
    {
        builder.ToTable("MatchParticipants");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.HasIndex(p => new { p.MatchId, p.PlayerId })
            .IsUnique()
            .HasDatabaseName("UQ_MatchParticipants_MatchId_PlayerId");

        builder.Property(p => p.Status)
            .HasConversion<byte>()
            .HasDefaultValue(ParticipantStatus.PendingApproval)
            .HasComment("0: PendingApproval, 1: PendingPayment, 2: Confirmed, 3: Rejected, 4: Cancelled, 5: Expired");

        builder.HasIndex(p => p.PlayerId)
            .HasDatabaseName("IX_MatchParticipants_PlayerId");

        builder.HasOne(p => p.Player)
            .WithMany(u => u.MatchParticipants)
            .HasForeignKey(p => p.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
