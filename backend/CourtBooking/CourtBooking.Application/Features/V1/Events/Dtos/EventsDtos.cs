using CourtBooking.Domain.Enums;
namespace CourtBooking.Application.Features.V1.Events.Dtos;
/// <summary>
/// DTO biểu diễn hình ảnh chi nhánh sân (lấy từ Branch.Images).
/// Dùng để hiển thị ảnh bìa sự kiện và banner không gian sân trên UI.
/// </summary>
public sealed record BranchImageDto(
    Guid ImageId,
    string Key,
    int DisplayOrder);
/// <summary>
/// DTO đại diện ảnh chung (Avatar người chơi, mã QR thanh toán của sân).
/// </summary>
public sealed record ImageDto(
    Guid Id,
    string Key);
/// <summary>
/// DTO hiển thị thẻ sự kiện ở màn hình danh sách (/events).
/// </summary>
public sealed record EventCardDto(
    Guid Id,
    string Title,
    Guid SportTypeId,
    string SportTypeName,
    Guid BranchId,
    string BranchName,
    string BranchAddress,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? SkillLevelFrom,
    string? SkillLevelTo,
    decimal TicketPrice,
    int Slots,
    int AvailableSlot,
    int BookedSlots,
    EventStatus Status,
    BranchImageDto? CoverImage);
/// <summary>
/// DTO tóm tắt người chơi đã đăng ký vé ("Người sẽ cùng tham gia" ở trang chi tiết).
/// </summary>
public sealed record EventParticipantDto(
    Guid PlayerId,
    string FullName,
    ImageDto? Avatar,
    int Quantity,
    DateTime RegisteredAt);
/// <summary>
/// Thông tin chi nhánh nơi diễn ra sự kiện, bao gồm danh sách ảnh sân và thông tin chuyển khoản.
/// </summary>
public sealed record EventBranchInfoDto(
    Guid BranchId,
    string BranchName,
    string Address,
    string? GgMapUrl,
    string AccountNumber,
    string AccountName,
    ImageDto? QrImage,
    IReadOnlyList<BranchImageDto> Images);
/// <summary>
/// DTO chi tiết sự kiện (/events/{id}).
/// </summary>
public sealed record EventDetailDto(
    Guid Id,
    string Title,
    string? Description,
    Guid SportTypeId,
    string SportTypeName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? SkillLevelFrom,
    string? SkillLevelTo,
    decimal TicketPrice,
    int Slots,
    int AvailableSlot,
    int BookedSlots,
    EventStatus Status,
    EventBranchInfoDto Branch,
    IReadOnlyList<EventParticipantDto> Participants);
/// <summary>
/// Kết quả trả về sau khi người chơi đặt vé thành công (render trang tóm tắt & xác nhận).
/// </summary>
public sealed record BookEventTicketResponse(
    Guid TicketId,
    Guid EventId,
    string EventTitle,
    string BranchName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int Quantity,
    decimal UnitPrice,
    decimal TotalAmount,
    PaymentMethod PaymentMethod,
    EventTicketStatus Status,
    DateTime CreatedAt,
    string? AccountNumber,
    string? AccountName,
    ImageDto? QrImage);
