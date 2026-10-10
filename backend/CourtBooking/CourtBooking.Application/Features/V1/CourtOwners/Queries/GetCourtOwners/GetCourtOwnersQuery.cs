using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.CourtOwners.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.CourtOwners.Queries.GetCourtOwners;

/// <summary>
/// Query tra cứu danh sách Chủ sân cho Quản trị viên (Admin Console).
/// Hỗ trợ tìm kiếm từ khóa theo Tên, Email hoặc Số điện thoại; lọc theo Trạng thái (Hoạt động / Đã khóa).
/// </summary>
public sealed record GetCourtOwnersQuery(
    string? Search = null,
    UserStatus? Status = null,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<CourtOwnerSummaryDto>>;
