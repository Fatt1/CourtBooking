using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.CourtOwners.Dtos;

/// <summary>
/// DTO tóm tắt thông tin Chủ sân trong danh sách quản trị của Admin Console.
/// </summary>
public sealed record CourtOwnerSummaryDto(
    Guid Id,
    string FullName,
    string? Email,
    string? PhoneNumber,
    string BusinessName,
    UserStatus Status,
    bool MustChangePwd,
    DateTime CreatedAt,
    string? CurrentPackageName,
    DateOnly? PackageStartDate,
    DateOnly? PackageEndDate,
    bool IsPackageActive);
