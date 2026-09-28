using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("Users");

        builder.Property(u => u.FullName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(u => u.Status)
            .HasConversion<int>()
            .HasDefaultValue(UserStatus.Active);

        builder.Property(u => u.AccountType)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(u => u.IsDeleted)
            .HasDefaultValue(false);

        builder.Property(u => u.CreatedAt)
            .IsRequired();

        builder.Property(u => u.UpdatedAt)
            .IsRequired();

        builder.HasQueryFilter(u => !u.IsDeleted);

        // Relationships
        builder.HasOne(u => u.PlayerProfile)
            .WithOne(p => p.User)
            .HasForeignKey<PlayerProfile>(p => p.Id)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.CourtOwner)
            .WithOne(c => c.User)
            .HasForeignKey<CourtOwner>(c => c.Id)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(r => r.User)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
