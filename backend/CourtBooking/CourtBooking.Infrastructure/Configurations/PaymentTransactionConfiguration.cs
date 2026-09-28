using CourtBooking.Domain.Entities.Payments;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CourtBooking.Infrastructure.Configurations;

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.ToTable("PaymentTransactions");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.OrderId)
            .HasComment("Nullable: null nếu đây là giao dịch của người chơi tham gia kèo");

        builder.Property(p => p.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.Type)
            .HasConversion<byte>()
            .HasDefaultValue(PaymentTransactionType.Payment)
            .HasComment("1: Thanh toán, 2: Hoàn tiền");

        builder.Property(p => p.Method)
            .HasConversion<byte>()
            .IsRequired();

        builder.Property(p => p.ProofImageId);

        builder.HasIndex(p => p.OrderId)
            .HasDatabaseName("IX_PaymentTransactions_OrderId");
    }
}
