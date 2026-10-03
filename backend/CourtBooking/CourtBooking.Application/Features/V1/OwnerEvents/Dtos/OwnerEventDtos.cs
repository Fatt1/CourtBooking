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
    Guid SportTypeId,
    string SportTypeName,
    IReadOnlyList<CourtSummaryDto> Courts,
    string CourtNames,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int Slots,
    int SoldTickets,
    int AvailableSlot,
    decimal TicketPrice,
    decimal EstimatedRevenue,
    EventStatus Status,
    string? Description,
    string? SkillLevelFrom,
    string? SkillLevelTo);

/// <summary>
/// DTO chi tiết sự kiện nạp vào Modal "Cập nhật sự kiện" của Chủ sân.
/// </summary>
public sealed record OwnerEventDetailDto(
    Guid Id,
    string Title,
    Guid SportTypeId,
    string SportTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal TicketPrice,
    int Slots,
    int AvailableSlot,
    int SoldTickets,
    string? SkillLevelFrom,
    string? SkillLevelTo,
    string? Description,
    EventStatus Status,
    IReadOnlyList<Guid> CourtIds,
    IReadOnlyList<CourtSummaryDto> Courts);

/// <summary>
/// DTO ảnh chụp màn hình chuyển khoản của người tham gia.
/// </summary>
public sealed record EventTicketProofImageDto(
    Guid Id,
    string Key);

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
    EventTicketProofImageDto? ProofImage,
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
