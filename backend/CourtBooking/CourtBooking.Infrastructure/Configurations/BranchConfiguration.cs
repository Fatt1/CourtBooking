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

        builder.Property(b => b.Name)
            .HasMaxLength(255)
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

        builder.Property(b => b.ReviewTotal)
            .HasDefaultValue(0);

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

        // CourtType là Aggregate Root riêng, tham chiếu Branch qua BranchId (Guid).
        // Không HasMany qua đây — mỗi aggregate có repository riêng.

        // Indexes
        builder.HasIndex(b => b.CourtOwnerId)
            .HasDatabaseName("IX_Branches_CourtOwnerId");

        builder.HasIndex(b => b.SportTypeId)
            .HasDatabaseName("IX_Branches_SportTypeId");
    }
}
