using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("Branches");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id).ValueGeneratedNever();

        builder.Property(b => b.Name)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(b => b.Hotline)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(b => b.GgMapUrl)
            .HasColumnName("GGMapUrl")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(b => b.Province)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(b => b.District)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(b => b.Street)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(b => b.Latitude)
            .HasPrecision(9, 6);

        builder.Property(b => b.Longitude)
            .HasPrecision(9, 6);

        builder.Property(b => b.IsActive)
            .HasDefaultValue(true);

        builder.Property(b => b.ReviewAverage)
            .HasDefaultValue(0.0);

        builder.Property(b => b.MinPrice)
            .HasPrecision(18, 2);

        builder.Property(b => b.MaxPrice)
            .HasPrecision(18, 2);

        builder.Property(b => b.Policy)
            .HasMaxLength(255);

        builder.Property(b => b.QrImageId)
            .IsRequired();

        builder.Property(b => b.AccountNumber)
            .HasColumnName("AccountNumer") // note: typo preserved from DB
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(b => b.AccountName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(b => b.CreatedAt).IsRequired();
        builder.Property(b => b.UpdatedAt).IsRequired();

        // Relationships
        builder.HasMany(b => b.Images)
            .WithOne(i => i.Branch)
            .HasForeignKey(i => i.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.CourtOwner)
            .WithMany(c => c.Branches)
            .HasForeignKey(b => b.CourtOwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.QrImage)
            .WithMany()
            .HasForeignKey(b => b.QrImageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(b => b.CourtTypes)
            .WithOne(ct => ct.Branch)
            .HasForeignKey(ct => ct.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.ServiceBranches)
            .WithOne(sb => sb.Branch)
            .HasForeignKey(sb => sb.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.Reviews)
            .WithOne(r => r.Branch)
            .HasForeignKey(r => r.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.Orders)
            .WithOne(o => o.Branch)
            .HasForeignKey(o => o.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(b => b.SocialMatches)
            .WithOne(sm => sm.Branch)
            .HasForeignKey(sm => sm.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(b => b.RetailOrders)
            .WithOne(ro => ro.Branch)
            .HasForeignKey(ro => ro.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(b => b.CourtOwnerId)
            .HasDatabaseName("IX_Branches_CourtOwnerId");

    }
}
