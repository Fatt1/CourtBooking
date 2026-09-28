using CourtBooking.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class CourtOwnerConfiguration : IEntityTypeConfiguration<CourtOwner>
{
    public void Configure(EntityTypeBuilder<CourtOwner> builder)
    {
        builder.ToTable("CourtOwners");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.BusinessName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(c => c.TaxCode)
            .HasMaxLength(50);

        builder.Property(c => c.QrImageId)
            .IsRequired();

        builder.Property(c => c.MustChangePwd)
            .HasDefaultValue(true);

        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();
    }
}
