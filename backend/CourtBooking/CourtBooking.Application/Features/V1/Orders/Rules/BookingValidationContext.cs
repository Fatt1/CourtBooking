using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Services;

namespace CourtBooking.Application.Features.V1.Orders.Common;

/// <summary>
/// Chứa toàn bộ dữ liệu đã được xác thực và chuẩn bị xong trước khi vào Lock.
/// </summary>
public sealed record BookingValidationContext(
    Branch Branch,
    List<Court> Courts,
    List<CalculatedSlotItem> CalculatedSlots,
    List<ServiceBranch> ServiceBranches,
    List<FlatSlotItem> FlatSlots)
{
    /// <summary>
    /// Tổng tiền sân đã tính.
    /// </summary>
    public decimal TotalCourtAmount => CalculatedSlots.Sum(s => s.Price);

    /// <summary>
    /// Danh sách key đã được sắp xếp để truyền vào KeyedLocker chống deadlock.
    /// Khóa theo từng block 30 phút theo format: court:{courtId}:{yyyyMMdd}:{HHmm}
    /// Nghiệp vụ các khung giờ luôn theo mốc 30 phút (00 hoặc 30).
    /// Ví dụ: 08:00 - 09:00 ngày 10/10/2026 trên sân 1 -> court:1:20261010:0800 và court:1:20261010:0830
    /// </summary>
    public List<string> GetLockKeys()
    {
        var keys = new HashSet<string>();

        foreach (var slot in FlatSlots)
        {
            if (slot.StartTime >= slot.EndTime)
            {
                continue;
            }

            var current = slot.StartTime;

            while (current < slot.EndTime)
            {
                keys.Add($"court:{slot.CourtId}:{slot.Date:yyyyMMdd}:{current:HHmm}");

                var next = current.AddMinutes(30);
                if (next <= current) // Tránh lặp vô hạn khi chạm hoặc qua nửa đêm 00:00
                {
                    break;
                }

                current = next;
            }
        }

        return keys.OrderBy(k => k, StringComparer.Ordinal).ToList();
    }
}
