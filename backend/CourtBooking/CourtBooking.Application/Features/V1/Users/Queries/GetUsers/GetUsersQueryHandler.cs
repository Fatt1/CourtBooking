using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Users.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Constants;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Users.Queries.GetUsers;

internal sealed class GetUsersQueryHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetUsersQuery, PagedList<UserSummaryDto>>
{
    public async Task<Result<PagedList<UserSummaryDto>>> Handle(GetUsersQuery request, CancellationToken ct)
    {
        var query = dbContext.Users.AsNoTracking();

        if (request.IncludeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        // Tìm kiếm theo từ khóa: Tên, Email hoặc Số điện thoại
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(u =>
                u.FullName.Contains(search) ||
                (u.Email != null && u.Email.Contains(search)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        // Lọc theo loại tài khoản / Role
        if (request.AccountType.HasValue)
        {
            query = query.Where(u => u.AccountType == request.AccountType.Value);
        }

        // Lọc theo trạng thái tài khoản
        if (request.Status.HasValue)
        {
            query = query.Where(u => u.Status == request.Status.Value);
        }

        // Sắp xếp người dùng mới tạo lên đầu
        query = query.OrderByDescending(u => u.CreatedAt);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new UserSummaryDto(
                u.Id,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                u.AccountType,
                RoleConstants.FromAccountType(u.AccountType),
                u.Status,
                u.IsDeleted,
                u.CreatedAt))
            .ToListAsync(ct);

        return Result.Success(new PagedList<UserSummaryDto>(items, totalCount, request.Page, request.PageSize));
    }
}
