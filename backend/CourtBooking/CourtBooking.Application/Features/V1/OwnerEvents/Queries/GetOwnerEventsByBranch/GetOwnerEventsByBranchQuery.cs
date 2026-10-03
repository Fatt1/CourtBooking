using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.OwnerEvents.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetOwnerEventsByBranch;

/// <summary>
/// Query lấy danh sách sự kiện của một chi nhánh dành cho Chủ sân (Tab "Sự kiện" trên Figma).
/// </summary>
public sealed record GetOwnerEventsByBranchQuery(
    Guid BranchId,
    Guid? SportTypeId = null,
    EventStatus? Status = null,
    DateOnly? Date = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    string? SearchTerm = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<OwnerEventItemDto>>;
