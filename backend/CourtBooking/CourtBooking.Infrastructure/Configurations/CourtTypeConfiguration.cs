using CourtBooking.Domain.Entities.Courts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

/// <summary>
/// CourtType là Aggregate Root riêng — có repository riêng.
/// Tham chiếu Branch qua BranchId (Guid), không navigation ngược về Branch.
/// </summary>
public class CourtTypeConfiguration : IEntityTypeConfiguration<CourtType>
{
    public void Configure(EntityTypeBuilder<CourtType> builder)
    {
        builder.ToTable("CourtTypes");

        builder.HasKey(ct => ct.Id);

        builder.Property(ct => ct.Name)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(ct => ct.MinutesConfig)
            .IsRequired();

        // BranchId là FK tham chiếu Branch aggregate — không cấu hình navigation ngược
        builder.Property(ct => ct.BranchId).IsRequired();

        builder.HasIndex(ct => ct.BranchId)
            .HasDatabaseName("IX_CourtTypes_BranchId");
    }
}
