using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Dtos;

/// <summary>
/// DTO tóm tắt sân con bị chiếm dụng bởi sự kiện.
/// </summary>
public sealed record CourtSummaryDto(
    Guid CourtId,
    string CourtName);

/// <summary>
/// DTO hiển thị từng dòng trong bảng Tab "Sự kiện" trên Màn hình Danh sách lịch đặt của Chủ sân.
/// </summary>
public sealed record OwnerEventItemDto(
    Guid Id,
    string EventCode,
    string Title,
    IReadOnlyList<CourtSummaryDto> Courts,
    DateTime StartDate,
    DateTime EndDate,
    int Slots,
    int SoldTickets,
    int AvailableSlot,
    decimal TicketPrice,
    decimal EstimatedRevenue,
    EventStatus Status,
    string? SkillLevelFrom,
    string? SkillLevelTo);

/// <summary>
/// DTO chi tiết từng slot sân đang được giữ bởi sự kiện.
/// </summary>
public sealed record OwnerEventSlotDetailDto(
    Guid OrderDetailId,
    Guid CourtId,
    string CourtName,
    Guid CourtTypeId,
    string CourtTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal Price);

/// <summary>
/// DTO chi tiết sự kiện nạp vào Modal "Cập nhật sự kiện" của Chủ sân.
/// </summary>
public sealed record OwnerEventDetailDto(
    Guid Id,
    Guid OrderId,
    string OrderCode,
    Guid BranchId,
    string BranchName,
    string? CustomerName,
    string? CustomerPhone,
    string? Note,
    string Title,
    Guid SportTypeId,
    string SportTypeName,
    DateTime StartDate,
    DateTime EndDate,
    decimal TicketPrice,
    int Slots,
    int AvailableSlot,
    int SoldTickets,
    string? SkillLevelFrom,
    string? SkillLevelTo,
    string? Description,
    EventStatus Status,
    IReadOnlyList<Guid> CourtIds,
    IReadOnlyList<CourtSummaryDto> Courts,
    IReadOnlyList<OwnerEventSlotDetailDto> SlotDetails);


/// <summary>
/// DTO từng dòng vé trong Modal "Người tham gia" (Quản lý vé & duyệt chuyển khoản).
/// </summary>
public sealed record EventParticipantItemDto(
    Guid TicketId,
    Guid PlayerId,
    string PlayerName,
    string? PlayerPhone,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    PaymentMethod PaymentMethod,
    EventTicketStatus Status,
    ImageDto? ProofImage,
    string? RefundNote,
    DateTime CreatedAt,
    DateTime? ReviewedAt);

/// <summary>
/// DTO tổng hợp dữ liệu cho Modal "Người tham gia: [Tên Sự Kiện]".
/// </summary>
public sealed record EventParticipantsResponse(
    Guid EventId,
    string EventTitle,
    decimal TotalRevenue,
    int TotalSlots,
    int SoldSlots,
    IReadOnlyList<EventParticipantItemDto> Participants);
