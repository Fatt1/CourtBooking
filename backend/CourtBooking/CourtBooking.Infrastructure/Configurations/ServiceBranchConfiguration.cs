using CourtBooking.Domain.Entities.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class ServiceBranchConfiguration : IEntityTypeConfiguration<ServiceBranch>
{
    public void Configure(EntityTypeBuilder<ServiceBranch> builder)
    {
        builder.ToTable("ServiceBranches");

        // Composite PK (ServiceId, BranchId)
        builder.HasKey(sb => new { sb.ServiceId, sb.BranchId });

        builder.Property(sb => sb.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(sb => sb.IsActive)
            .HasDefaultValue(true);

        builder.HasIndex(sb => sb.BranchId)
            .HasDatabaseName("IX_ServiceBranches_BranchId");

        // Relationships
        builder.HasOne(sb => sb.Branch)
            .WithMany(b => b.ServiceBranches)
            .HasForeignKey(sb => sb.BranchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
