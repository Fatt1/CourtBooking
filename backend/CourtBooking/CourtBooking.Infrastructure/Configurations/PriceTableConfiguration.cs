using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class PriceTableConfiguration : IEntityTypeConfiguration<PriceTable>
{
    public void Configure(EntityTypeBuilder<PriceTable> builder)
    {
        builder.ToTable("PriceTables");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(p => p.IsActive)
            .HasDefaultValue(true);

        builder.Property(p => p.DefaultPrice)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt).IsRequired();

        // Relationships
        builder.HasMany(p => p.Rules)
            .WithOne(r => r.PriceTable)
            .HasForeignKey(r => r.PriceTableId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.CourtTypeId)
            .HasDatabaseName("IX_PriceTables_CourtTypeId");
    }
}
