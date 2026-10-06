using CourtBooking.Application.Features.V1.Storages.Dtos;

namespace CourtBooking.Application.Features.V1.Services.Dtos;

public sealed record ServiceByBranchDto(
    Guid Id,
    string Name,
    string Unit,
    Guid CategoryId,
    ImageDto? Image,
    Guid BranchId,
    decimal Price,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt);


public sealed record ServiceBranchItemDto(
    Guid BranchId,
    decimal Price,
    bool IsActive
    );

public sealed record ServiceResponseDto(
    Guid Id,
    Guid CategoryId,
    string Name,
    string Unit,
    Guid? ImageId,
    IReadOnlyList<ServiceBranchItemDto> Branches);

public sealed record OwnerServiceBranchDto(
    Guid BranchId,
    string BranchName,
    decimal Price,
    bool IsActive);

public sealed record OwnerServiceDto(
    Guid Id,
    string Name,
    string Unit,
    Guid CategoryId,
    ImageDto? Image,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<OwnerServiceBranchDto> Branches);


