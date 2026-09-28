using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class PriceTableRuleConfiguration : IEntityTypeConfiguration<PriceTableRule>
{
    public void Configure(EntityTypeBuilder<PriceTableRule> builder)
    {
        builder.ToTable("PriceTableRules");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.FixedCustomerPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(r => r.WalkInCustomerPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasIndex(r => r.PriceTableId)
            .HasDatabaseName("IX_PriceTableRules_PriceTableId");
    }
}
