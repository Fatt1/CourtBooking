using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Users.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Users.Queries.GetUsers;

/// <summary>
/// Query tra cứu danh sách người dùng cho Quản trị viên (Admin).
/// Hỗ trợ tìm kiếm từ khóa, lọc theo AccountType, Status, phân trang và xem tài khoản đã xóa mềm.
/// </summary>
public sealed record GetUsersQuery(
    string? Search = null,
    AccountType? AccountType = null,
    UserStatus? Status = null,
    bool IncludeDeleted = false,
    int Page = 1,
    int PageSize = 10) : PaginationQuery(Page, PageSize), IQuery<PagedList<UserSummaryDto>>;
