using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class ImageConfiguration : IEntityTypeConfiguration<Image>
{
    public void Configure(EntityTypeBuilder<Image> builder)
    {
        builder.ToTable("Images");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Url)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(i => i.StorageProvider)
            .HasConversion<byte>()
            .IsRequired()
            .HasComment("1=Cloudinary, 2=S3, 3=AzureBlob");

        builder.Property(i => i.StorageKey)
            .HasMaxLength(255)
            .IsRequired()
            .HasComment("public_id/object key - dùng để gọi API xoá file thật trên storage");

        builder.Property(i => i.Status)
            .HasConversion<byte>()
            .HasDefaultValue(ImageStatus.Pending);

        builder.Property(i => i.AttachedAt);
    }
}
