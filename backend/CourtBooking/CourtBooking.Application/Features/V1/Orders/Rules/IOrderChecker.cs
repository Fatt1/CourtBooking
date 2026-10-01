using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Features.V1.Orders.Common;

/// <summary>
/// Service dùng chung phụ trách xác thực chi nhánh, sân, bảng giá, dịch vụ và kiểm tra trùng lịch đặt sân.
/// </summary>
public interface IOrderChecker
{
    /// <summary>
    /// Làm phẳng danh sách các slot sân từ cấu trúc nhóm DTO.
    /// </summary>
    List<FlatSlotItem> FlattenSlots(List<CourtBookingSlot> courtSlots);

    /// <summary>
    /// Kiểm tra toàn diện trước khi vào Lock (Branch, Courts, PriceTables & tính giá, Services).
    /// </summary>
    Task<Result<BookingValidationContext>> ValidateBookingAsync(
        Guid branchId,
        List<CourtBookingSlot> courtSlots,
        List<OrderServiceItem>? services,
        bool isFixedCustomer,
        CancellationToken cancellationToken);

    /// <summary>
    /// Kiểm tra trùng lịch hoặc giữ chỗ còn hiệu lực trong database (chạy bên trong Lock).
    /// </summary>
    Task<Result> CheckConflictsAsync(
        List<FlatSlotItem> allSlots,
        CancellationToken cancellationToken);

    /// <summary>
    /// Kiểm tra chi nhánh và giờ mở cửa.
    /// </summary>
    Task<Result<Branch>> ValidateBranchAsync(
        Guid branchId,
        List<FlatSlotItem> allSlots,
        CancellationToken cancellationToken);

    /// <summary>
    /// Kiểm tra danh sách sân thuộc chi nhánh, trạng thái hoạt động và khớp loại sân.
    /// </summary>
    Task<Result<List<Court>>> ValidateCourtsAsync(
        Guid branchId,
        List<FlatSlotItem> allSlots,
        CancellationToken cancellationToken);

    /// <summary>
    /// Kiểm tra các bảng giá và tính trước giá cho từng slot.
    /// </summary>
    Task<Result<List<CalculatedSlotItem>>> ValidatePriceTablesAndCalculatePricesAsync(
        List<CourtBookingSlot> courtSlots,
        bool isFixedCustomer,
        CancellationToken cancellationToken);

    /// <summary>
    /// Kiểm tra dịch vụ có tồn tại và đang hoạt động tại chi nhánh hay không.
    /// </summary>
    Task<Result<List<ServiceBranch>>> ValidateServicesAsync(
        Guid branchId,
        List<OrderServiceItem>? services,
        CancellationToken cancellationToken);
}
