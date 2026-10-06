using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Users.Dtos;

/// <summary>
/// DTO tóm tắt thông tin người dùng trong danh sách quản trị.
/// </summary>
public sealed record UserSummaryDto(
    Guid Id,
    string FullName,
    string? Email,
    string? PhoneNumber,
    AccountType AccountType,
    string Role,
    UserStatus Status,
    bool IsDeleted,
    DateTime CreatedAt);
