using CourtBooking.Domain.Entities.Events;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class EventTicketConfiguration : IEntityTypeConfiguration<EventTicket>
{
    public void Configure(EntityTypeBuilder<EventTicket> builder)
    {
        builder.ToTable("EventTickets");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id).ValueGeneratedNever();

        builder.Property(t => t.Quantity)
            .HasDefaultValue(1);

        builder.Property(t => t.PaymentMethod)
            .HasConversion<byte>()
            .IsRequired()
            .HasComment("1=Tiền mặt, 2=Chuyển khoản QR");

        builder.Property(t => t.ProofImageId)
            .HasComment("ImageId ảnh chụp màn hình CK - NULL nếu trả tiền mặt tại chỗ");

        builder.Property(t => t.Status)
            .HasConversion<byte>()
            .HasDefaultValue(EventTicketStatus.PendingApproval);

        builder.Property(t => t.RefundNote)
            .HasMaxLength(255)
            .HasComment("Lý do/ghi chú hoàn tiền nếu Status=Refunded");

        builder.Property(t => t.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasIndex(t => t.EventId)
            .HasDatabaseName("IX_EventTickets_EventId");

        builder.HasIndex(t => t.PlayerId)
            .HasDatabaseName("IX_EventTickets_PlayerId");

        // Relationships
        builder.HasOne(t => t.Player)
            .WithMany(u => u.EventTickets)
            .HasForeignKey(t => t.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.ProofImage)
            .WithMany()
            .HasForeignKey(t => t.ProofImageId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
