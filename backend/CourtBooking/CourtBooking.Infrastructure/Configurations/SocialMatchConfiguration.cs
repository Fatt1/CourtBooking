using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class SocialMatchConfiguration : IEntityTypeConfiguration<SocialMatch>
{
    public void Configure(EntityTypeBuilder<SocialMatch> builder)
    {
        builder.ToTable("SocialMatches");

        builder.HasKey(m => m.Id);

        builder.HasIndex(m => m.OrderId)
            .IsUnique();

        builder.Property(m => m.SkillLevel)
            .HasMaxLength(50);

        builder.Property(m => m.FeePerPlayer)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(m => m.ApprovalMode)
            .HasDefaultValue((byte)0)
            .HasComment("0: Tự động duyệt, 1: Chủ kèo duyệt tay");

        builder.Property(m => m.Status)
            .HasConversion<byte>()
            .HasDefaultValue(SocialMatchStatus.Open)
            .HasComment("0: Open, 1: Full, 2: Closed, 3: Cancelled");

        builder.Property(m => m.Description)
            .HasMaxLength(500);

        // Relationships
        builder.HasOne(m => m.Order)
            .WithOne(o => o.SocialMatch)
            .HasForeignKey<SocialMatch>(m => m.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Branch)
            .WithMany(b => b.SocialMatches)
            .HasForeignKey(m => m.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.SportType)
            .WithMany(st => st.SocialMatches)
            .HasForeignKey(m => m.SportTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Host)
            .WithMany()
            .HasForeignKey(m => m.HostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(m => m.Participants)
            .WithOne(p => p.Match)
            .HasForeignKey(p => p.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(m => m.BranchId)
            .HasDatabaseName("IX_SocialMatches_BranchId");

        builder.HasIndex(m => m.SportTypeId)
            .HasDatabaseName("IX_SocialMatches_SportTypeId");

        builder.HasIndex(m => m.HostId)
            .HasDatabaseName("IX_SocialMatches_HostId");
    }
}
