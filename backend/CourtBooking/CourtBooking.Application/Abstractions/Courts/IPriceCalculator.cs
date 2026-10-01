using CourtBooking.Domain.Entities.Courts;

namespace CourtBooking.Application.Abstractions.Courts;

/// <summary>
/// Service tính toán giá thuê sân dựa trên cấu hình bảng giá (PriceTable) và các quy tắc giá (PriceTableRules).
/// </summary>
public interface IPriceCalculator
{
    /// <summary>
    /// Tính giá cho một khung giờ đặt sân trực tiếp từ đối tượng PriceTable đã nạp sẵn (không query database).
    /// </summary>
    decimal CalculatePrice(
        PriceTable priceTable,
        DateOnly date,
        TimeOnly startTime,
        TimeOnly endTime,
        bool isFixedCustomer = false);

    /// <summary>
    /// Tính giá cho một khung giờ đặt sân theo PriceTableId (truy vấn PriceTable từ database).
    /// </summary>
    Task<decimal?> CalculateSlotPriceAsync(
        Guid priceTableId,
        DateOnly date,
        TimeOnly startTime,
        TimeOnly endTime,
        bool isFixedCustomer = false,
        CancellationToken cancellationToken = default);
}
