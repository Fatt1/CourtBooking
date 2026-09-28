using CourtBooking.Domain.Entities.Subscriptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class CourtOwnerSubscriptionConfiguration : IEntityTypeConfiguration<CourtOwnerSubscription>
{
    public void Configure(EntityTypeBuilder<CourtOwnerSubscription> builder)
    {
        builder.ToTable("CourtOwnerSubscriptions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.PricePaid)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasIndex(s => s.CourtOwnerId)
            .HasDatabaseName("IX_CourtOwnerSubscriptions_CourtOwnerId");

        builder.HasIndex(s => s.ServicePackageId)
            .HasDatabaseName("IX_CourtOwnerSubscriptions_ServicePackageId");
    }
}
