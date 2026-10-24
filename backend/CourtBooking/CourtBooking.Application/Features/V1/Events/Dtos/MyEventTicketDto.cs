using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Events.Dtos;

/// <summary>
/// DTO thông tin vé và sự kiện mà người chơi đã đăng ký tham gia
/// </summary>
public sealed record MyEventTicketDto(
    Guid TicketId,
    Guid EventId,
    string EventTitle,
    Guid SportTypeId,
    string SportTypeName,
    Guid BranchId,
    string BranchName,
    string BranchAddress,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int Quantity,
    decimal Price,
    decimal TotalAmount,
    PaymentMethod PaymentMethod,
    EventTicketStatus Status,
    DateTime CreatedAt,
    DateTime? ReviewedAt,
    string? RefundNote,
    BranchImageDto? CoverImage,
    string? BankName,
    string? BankCode,
    string? AccountNumber,
    string? AccountName,
    ImageDto? QrImage,
    DateTime? ExpiresAt);
