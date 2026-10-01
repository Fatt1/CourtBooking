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
    /// Danh sách key đã được sắp xếp để truyền vào KeyedLocker chống deadlock.
    /// </summary>
    public List<string> GetLockKeys() => FlatSlots
        .Select(s => $"court:{s.CourtId}:{s.Date:yyyyMMdd}")
        .Distinct()
        .OrderBy(k => k, StringComparer.Ordinal)
        .ToList();


}
